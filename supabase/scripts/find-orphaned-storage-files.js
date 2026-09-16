/**
 * 삭제된 프로젝트가 남긴 고아 스토리지 파일을 찾는 스캔 스크립트 (읽기 전용 — 아무것도 지우지 않음)
 *
 * 대상 버킷: post-images(게시물 사진 + project-thumbnails/ 대표이미지), pattern-pdfs(패턴 PDF)
 * DB(post_images.image_url, projects.thumbnail_url, projects.pattern_url)에서
 * 더 이상 참조되지 않는 파일을 찾아 orphaned-storage-files.json으로 저장한다.
 *
 * 사용법 (dev/prod 각각 실행):
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   node supabase/scripts/find-orphaned-storage-files.js
 *
 * SUPABASE_SERVICE_ROLE_KEY는 Supabase Dashboard > Project Settings > API에서 확인
 * (anon key로는 storage RLS에 막혀 다른 유저 파일까지 못 보므로 반드시 service role key 사용, 절대 커밋 금지)
 */

const fs = require('fs');
const {createClient} = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const POST_IMAGES_BUCKET = 'post-images';
const PATTERN_PDFS_BUCKET = 'pattern-pdfs';
const LIST_PAGE_SIZE = 1000;

function stripPublicUrlPrefix(value, bucket) {
  const prefix = `/storage/v1/object/public/${bucket}/`;
  const idx = value.indexOf(prefix);
  return idx >= 0 ? value.slice(idx + prefix.length) : value;
}

// 테이블의 모든 행을 페이지네이션으로 수집 (PostgREST max_rows 설정에 걸려
// 1000행 이상인 테이블에서 뒷부분이 조용히 누락되는 걸 방지)
async function selectAll(table, columns, pageSize = 1000) {
  const rows = [];
  let from = 0;
  while (true) {
    const {data, error} = await supabase
      .from(table)
      .select(columns)
      .order('id', {ascending: true})
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

// 버킷 내 모든 파일 경로를 재귀적으로 수집 (폴더는 metadata가 없는 항목으로 구분됨)
async function listAllFiles(bucket, prefix = '') {
  const files = [];
  let offset = 0;

  while (true) {
    const {data, error} = await supabase.storage.from(bucket).list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: {column: 'name', order: 'asc'},
    });
    if (error) {
      console.error(`[${bucket}] list 실패 (${prefix || '/'}):`, error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        const nested = await listAllFiles(bucket, fullPath);
        files.push(...nested);
      } else {
        files.push({
          path: fullPath,
          size: entry.metadata?.size ?? null,
          updatedAt: entry.updated_at ?? null,
        });
      }
    }

    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return files;
}

async function main() {
  console.log(`대상: ${SUPABASE_URL}`);
  console.log('스토리지 파일 목록 수집 중...');
  const [postImageFiles, patternPdfFiles] = await Promise.all([
    listAllFiles(POST_IMAGES_BUCKET),
    listAllFiles(PATTERN_PDFS_BUCKET),
  ]);
  console.log(`post-images: ${postImageFiles.length}개, pattern-pdfs: ${patternPdfFiles.length}개`);

  console.log('DB에서 참조 중인 파일 경로 조회 중... (페이지네이션으로 전체 행 수집)');
  const [postImagesData, projectsData] = await Promise.all([
    selectAll('post_images', 'image_url'),
    selectAll('projects', 'thumbnail_url, pattern_url'),
  ]);
  console.log(`post_images 행: ${postImagesData.length}개, projects 행: ${projectsData.length}개`);

  const referencedPostImagePaths = new Set();
  postImagesData.forEach(row => {
    if (row.image_url) {
      referencedPostImagePaths.add(stripPublicUrlPrefix(row.image_url, POST_IMAGES_BUCKET));
    }
  });
  projectsData.forEach(row => {
    // 대표이미지는 post-images 버킷 파일(project-thumbnails/ 업로드 또는 자기 게시물 이미지 재사용)일 수 있음
    if (row.thumbnail_url) {
      referencedPostImagePaths.add(stripPublicUrlPrefix(row.thumbnail_url, POST_IMAGES_BUCKET));
    }
  });

  const referencedPatternPdfPaths = new Set();
  projectsData.forEach(row => {
    if (row.pattern_url) {
      referencedPatternPdfPaths.add(stripPublicUrlPrefix(row.pattern_url, PATTERN_PDFS_BUCKET));
    }
  });

  const orphanedPostImages = postImageFiles.filter(f => !referencedPostImagePaths.has(f.path));
  const orphanedPatternPdfs = patternPdfFiles.filter(f => !referencedPatternPdfPaths.has(f.path));

  const totalOrphanBytes = [...orphanedPostImages, ...orphanedPatternPdfs].reduce(
    (sum, f) => sum + (f.size || 0),
    0,
  );

  console.log('\n=== 고아 파일 (DB에서 참조 없음) ===');
  console.log(`post-images: ${orphanedPostImages.length}개`);
  console.log(`pattern-pdfs: ${orphanedPatternPdfs.length}개`);
  console.log(
    `총 ${orphanedPostImages.length + orphanedPatternPdfs.length}개, 약 ${(totalOrphanBytes / 1024 / 1024).toFixed(2)}MB`,
  );

  const outputPath = 'orphaned-storage-files.json';
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        scannedAt: new Date().toISOString(),
        supabaseUrl: SUPABASE_URL,
        postImages: orphanedPostImages,
        patternPdfs: orphanedPatternPdfs,
      },
      null,
      2,
    ),
  );
  console.log(`\n상세 목록을 ${outputPath} 에 저장했습니다. 삭제는 이 파일 확인 후 별도로 진행하세요.`);
}

main().catch(err => {
  console.error('스캔 실패:', err);
  process.exit(1);
});
