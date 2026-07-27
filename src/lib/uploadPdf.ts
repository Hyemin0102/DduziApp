import {supabase} from '@/lib/supabase';

const PATTERN_PDFS_BUCKET = 'pattern-pdfs';
const PUBLIC_URL_PREFIX = `/storage/v1/object/public/${PATTERN_PDFS_BUCKET}/`;

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * URL에서 PDF 표시 이름 추출
 * 저장 형식: {timestamp}_{safeName}
 */
export const getPdfNameFromUrl = (url: string): string => {
  const segment = decodeURIComponent(url.split('/').pop() || '');
  const match = segment.match(/^\d+_(.+)$/);
  return match ? match[1] : segment;
};

// 버킷이 public이던 시절 저장된 값은 풀 URL이라, signed URL 발급 전에 path만 추출
const toStoragePath = (value: string): string => {
  const idx = value.indexOf(PUBLIC_URL_PREFIX);
  return idx >= 0 ? value.slice(idx + PUBLIC_URL_PREFIX.length) : value;
};

/**
 * 저장된 PDF의 열람용 signed URL 발급 (pattern-pdfs 버킷은 private)
 * @param pathOrUrl - 업로드 시 저장된 storage path (또는 과거 저장된 풀 URL)
 * @param expiresIn - URL 유효기간(초), 기본 5분
 */
export const getSignedPdfUrl = async (
  pathOrUrl: string,
  expiresIn = 300,
): Promise<string | null> => {
  try {
    const path = toStoragePath(pathOrUrl);
    const {data, error} = await supabase.storage
      .from(PATTERN_PDFS_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('PDF signed URL 발급 에러:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('PDF signed URL 발급 실패:', error);
    return null;
  }
};

/**
 * 기존 PDF 삭제 (교체/제거 시 이전 파일이 버킷에 남지 않도록 정리)
 * @param pathOrUrl - 삭제할 storage path (또는 과거 저장된 풀 URL)
 */
export const removePdf = async (pathOrUrl: string): Promise<void> => {
  try {
    const path = toStoragePath(pathOrUrl);
    await supabase.storage.from(PATTERN_PDFS_BUCKET).remove([path]);
  } catch (error) {
    console.error('이전 PDF 삭제 실패:', error);
  }
};

/**
 * PDF 파일 업로드
 * @param uri - 파일 URI (file://)
 * @param folderPath - 폴더 경로
 * @param originalName - 원본 파일명 (표시용)
 * @returns 업로드된 PDF의 storage path (private 버킷이라 공개 URL이 아님)
 */
export const uploadPdf = async (
  uri: string,
  folderPath: string,
  originalName: string,
): Promise<string | null> => {
  try {
    // Supabase Storage 키는 한글 등 비ASCII 문자를 허용하지 않아 'Invalid key' 에러가 남.
    // 원본 파일명은 DB의 pattern_pdf_name 컬럼에 따로 저장하므로, 키 자체는 확장자만 남김.
    const extMatch = originalName.match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0] : '.pdf';
    const fileName = `${Date.now()}${ext}`;
    const filePath = `${folderPath}/${fileName}`;

    // RNFS 대신 fetch 사용 — iOS 한글 경로 문제 우회
    const response = await fetch(uri);
    if (!response.ok) throw new Error('파일을 읽을 수 없습니다.');
    const arrayBuffer = await response.arrayBuffer();

    const {error} = await supabase.storage
      .from(PATTERN_PDFS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'application/pdf',
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      console.error('PDF 업로드 에러:', error);
      return null;
    }

    return filePath;
  } catch (error) {
    console.error('PDF 업로드 실패:', error);
    return null;
  }
};
