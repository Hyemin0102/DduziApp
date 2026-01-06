// utils/uploadImage.ts
import RNFS from 'react-native-fs';
import {decode} from 'base64-arraybuffer';
import {supabase} from '@/lib/supabase';

/**
 * 단일 이미지 업로드
 * @param uri - 이미지 URI
 * @param bucket - Storage 버킷 이름 ('profile' | 'post-images')
 * @param folderPath - 폴더 경로 (예: userId, postId)
 * @returns 업로드된 이미지의 공개 URL
 */
export const uploadImage = async (
  uri: string,
  bucket: string,
  folderPath: string,
): Promise<string | null> => {
  try {
    // 파일 확장자 추출
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    // React Native에서 파일 읽기
    const base64Data = await RNFS.readFile(
      uri.replace('file://', ''),
      'base64',
    );

    // Supabase Storage에 업로드
    const {data, error} = await supabase.storage
      .from(bucket)
      .upload(filePath, decode(base64Data), {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('업로드 에러:', error);
      return null;
    }

    // 공개 URL 가져오기
    const {data: urlData} = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('✅ 업로드 성공:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return null;
  }
};

/**
 * 여러 이미지 업로드
 * @param images - 이미지 배열
 * @param bucket - Storage 버킷 이름
 * @param folderPath - 폴더 경로
 * @returns 업로드된 이미지 URL 배열
 */
export const uploadMultipleImages = async (
  images: Array<{uri: string}>,
  bucket: string,
  folderPath: string,
): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (const image of images) {
    const url = await uploadImage(image.uri, bucket, folderPath);
    if (url) {
      uploadedUrls.push(url);
    }
  }

  return uploadedUrls;
};

/**
 * 프로필 이미지 업로드 (기존 함수 - 호환성 유지)
 */
// export const uploadProfileImage = async (
//   uri: string,
//   userId: string,
// ): Promise<string | null> => {
//   return uploadImage(uri, 'profile', userId);
// };
