/**
 * Supabase Storage URL을 Image Transform URL로 변환
 * Image Transformations 기능 활성화 시 주석 해제할 것
 * 대시보드 → Storage → Settings → Image Transformations
 */

// type ResizeMode = 'cover' | 'contain' | 'fill';

// interface TransformOptions {
//   width?: number;
//   height?: number;
//   resize?: ResizeMode;
//   quality?: number;
// }

// export const getTransformUrl = (
//   url: string | null | undefined,
//   options: TransformOptions,
// ): string | null => {
//   if (!url) return null;

//   if (!url.includes('/storage/v1/object/public/')) return url;

//   const renderUrl = url.replace(
//     '/storage/v1/object/public/',
//     '/storage/v1/render/image/public/',
//   );

//   const params = new URLSearchParams();
//   if (options.width) params.set('width', String(options.width));
//   if (options.height) params.set('height', String(options.height));
//   if (options.resize) params.set('resize', options.resize);
//   if (options.quality) params.set('quality', String(options.quality));

//   return `${renderUrl}?${params.toString()}`;
// };

// export const thumbnailUrl = (url: string | null | undefined) =>
//   getTransformUrl(url, {width: 400, height: 400, resize: 'cover', quality: 80});

// export const profileUrl = (url: string | null | undefined) =>
//   getTransformUrl(url, {width: 120, height: 120, resize: 'cover', quality: 80});

// export const detailUrl = (url: string | null | undefined) =>
//   getTransformUrl(url, {width: 1080, quality: 85});


//Image Transformation 켜지 않았을 때 가정
export const thumbnailUrl = (url: string | null | undefined): string | null =>
  url ?? null;

export const profileUrl = (url: string | null | undefined): string | null =>
  url ?? null;

export const detailUrl = (url: string | null | undefined): string | null =>
  url ?? null;
