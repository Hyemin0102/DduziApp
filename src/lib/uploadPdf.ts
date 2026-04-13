import {supabase} from '@/lib/supabase';

/**
 * URL에서 PDF 표시 이름 추출
 * 저장 형식: {timestamp}_{safeName}
 */
export const getPdfNameFromUrl = (url: string): string => {
  const segment = decodeURIComponent(url.split('/').pop() || '');
  const match = segment.match(/^\d+_(.+)$/);
  return match ? match[1] : segment;
};

/**
 * PDF 파일 업로드
 * @param uri - 파일 URI (file://)
 * @param folderPath - 폴더 경로
 * @param originalName - 원본 파일명 (표시용)
 * @returns 업로드된 PDF의 공개 URL
 */
export const uploadPdf = async (
  uri: string,
  folderPath: string,
  originalName: string,
): Promise<string | null> => {
  try {
    const safeName = originalName
      .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/, '');

    const fileName = `${Date.now()}_${safeName}`;
    const filePath = `${folderPath}/${fileName}`;

    // RNFS 대신 fetch 사용 — iOS 한글 경로 문제 우회
    const response = await fetch(uri);
    if (!response.ok) throw new Error('파일을 읽을 수 없습니다.');
    const arrayBuffer = await response.arrayBuffer();

    const {error} = await supabase.storage
      .from('pattern-pdfs')
      .upload(filePath, arrayBuffer, {
        contentType: 'application/pdf',
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      console.error('PDF 업로드 에러:', error);
      return null;
    }

    const {data: urlData} = supabase.storage
      .from('pattern-pdfs')
      .getPublicUrl(filePath);

    console.log('✅ PDF 업로드 성공:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('PDF 업로드 실패:', error);
    return null;
  }
};
