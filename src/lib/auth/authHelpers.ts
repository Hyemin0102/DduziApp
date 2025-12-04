
// 이미지 URL 정규화
export const normalizeImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;

//  http를 https로 변경 (필요시)
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
};



