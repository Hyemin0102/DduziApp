/**
 * Supabase Storage Image Transformation
 * /object/public/ → /render/image/public/ + width/quality 파라미터 추가
 * 외부 URL(카카오, 애플 등 소셜 프로필)은 변환하지 않음
 */
export const getResizedImageUrl = (
  url: string | null | undefined,
  width: number,
  quality: number = 75,
): string | null => {
  console.log('sss',url);
  
  if (!url) return null;

  // Supabase Storage URL이 아니면 그대로 반환
  if (!url.includes('/storage/v1/object/public/')) return url;

  const resized = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  );

  return `${resized}?width=${width}&quality=${quality}`;
};
