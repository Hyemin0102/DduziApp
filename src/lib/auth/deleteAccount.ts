import {supabase} from '../supabase';
import {unlink as KakaoUnlink} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

// 버킷의 특정 폴더 안에 있는 파일을 전부 조회 후 삭제
const removeBucketFolder = async (bucket: string, folderPath: string) => {
  const {data: files, error: listError} = await supabase.storage
    .from(bucket)
    .list(folderPath);
  if (listError) {
    console.warn(`⚠️ ${bucket}/${folderPath} 목록 조회 실패:`, listError);
    return;
  }
  if (!files?.length) return;
  const paths = files.map(f => `${folderPath}/${f.name}`);
  const {error: removeError} = await supabase.storage
    .from(bucket)
    .remove(paths);
  if (removeError) {
    console.warn(`⚠️ ${bucket}/${folderPath} 삭제 실패:`, removeError);
  }
};

/**
 * 탈퇴 시 Storage에서 정리해야 하는 리소스
 * - profile 버킷의 {userId}/ 폴더: 프로필 이미지
 * - pattern-pdfs 버킷의 {userId}/ 폴더: 도안 PDF
 * - post-images 버킷의 {postId}/ 폴더: 게시물 이미지 (post-images는 유저 단위가 아니라
 *   게시물 단위로 폴더가 나뉘어 있어, 유저가 작성한 post id들을 먼저 조회해야 함)
 *
 * DB 행(publiimage.pngc.users → posts/projects/post_images 등)은 delete_user RPC의 FK cascade로 삭제되지만,
 * 그건 Postgres 행만 지울 뿐 실제 Storage(S3) 파일은 지우지 않으므로 별도로 처리해야 함.
 * 경로를 조회하려면 DB 행이 남아있어야 하므로 delete_user RPC보다 먼저 실행해야 함.
 * 정리에 실패해도(권한 문제 등) 탈퇴 자체는 막지 않음 (best-effort).
 */
const cleanupUserStorage = async (userId: string) => {
  try {
    await removeBucketFolder('profile', userId);
    await removeBucketFolder('pattern-pdfs', userId);

    const {data: posts} = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);
    if (posts?.length) {
      await Promise.all(
        posts.map(p => removeBucketFolder('post-images', p.id)),
      );
    }
  } catch (e) {
    console.warn('⚠️ 스토리지 정리 실패 (탈퇴는 계속 진행):', e);
  }
};

export const deleteAccount = async (provider: string): Promise<void> => {
  const {
    data: {user},
  } = await supabase.auth.getUser();

  // 1. Apple: revoke 실패 시 탈퇴 중단 (토큰이 유효하게 남는 보안 이슈 방지)
  if (provider === 'apple') {
    const {error: revokeError} = await supabase.functions.invoke('apple-auth', {
      body: {action: 'revoke'},
    });
    if (revokeError) throw revokeError;
  }

  // 2. 카카오/구글: 연결 끊기 실패해도 탈퇴 계속 진행
  try {
    switch (provider) {
      case 'kakao':
        await KakaoUnlink();
        break;
      case 'google':
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        break;
    }
  } catch (e) {
    console.warn('⚠️ provider 연결 끊기 실패 (탈퇴 계속 진행):', e);
  }

  // 3. Storage 파일 정리 (DB 행이 삭제되기 전에 경로를 조회해야 하므로 delete_user보다 먼저 실행)
  if (user?.id) {
    await cleanupUserStorage(user.id);
  }

  // 4. DB 삭제 (public.users, auth.users → FK cascade로 posts/projects/post_images 등 행 삭제)
  const {error} = await supabase.rpc('delete_user');
  if (error) throw error;

  // 5. 로컬 세션 종료 (onAuthStateChange가 나머지 정리 처리)
  await supabase.auth.signOut();
};
