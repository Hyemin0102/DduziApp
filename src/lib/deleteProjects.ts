// 내 프로젝트 삭제 (프로젝트 상세 단건 삭제 / 프로젝트 목록 다중 삭제 공통)
import {supabase} from '@/lib/supabase';
import {deletePostImageFiles, removeProjectThumbnail} from '@/lib/uploadImage';
import {removePdf} from '@/lib/uploadPdf';

export const deleteProjects = async (projectIds: string[]) => {
  if (projectIds.length === 0) return;

  // 목록의 thumbnail_url은 게시물 사진으로 대체된 값일 수 있어서, 실제 저장값을 다시 조회
  const [{data: projects, error: projectsError}, {data: posts, error: postsError}] =
    await Promise.all([
      supabase.from('projects').select('id, thumbnail_url, pattern_url').in('id', projectIds),
      supabase.from('posts').select('id, post_images ( image_url )').in('project_id', projectIds),
    ]);
  if (projectsError) throw projectsError;
  if (postsError) throw postsError;

  const postIds = (posts ?? []).map((p: any) => p.id);
  const postImageUrls = (posts ?? []).flatMap((p: any) =>
    (p.post_images ?? []).map((img: any) => img.image_url),
  );

  // 게시물 이미지의 Storage DELETE 정책이 posts.user_id 서브쿼리로
  // 소유권을 확인하므로, posts 행을 지우기 전에 먼저 정리해야 함
  await deletePostImageFiles(postImageUrls);

  if (postIds.length > 0) {
    await supabase.from('post_images').delete().in('post_id', postIds);
    await supabase.from('posts').delete().in('id', postIds);
  }
  await supabase.from('knitting_logs').delete().in('project_id', projectIds);
  const {error} = await supabase.from('projects').delete().in('id', projectIds);
  if (error) throw error;

  // 대표이미지/PDF는 project 행 삭제 후 정리 — 대표이미지가 자기 게시물 이미지를
  // 재사용 중이었다면 위에서 이미 지워졌으므로 무해함
  (projects ?? []).forEach((p: any) => {
    if (p.thumbnail_url) removeProjectThumbnail(p.thumbnail_url);
    if (p.pattern_url) removePdf(p.pattern_url);
  });
};
