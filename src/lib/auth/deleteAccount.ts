import {supabase} from '../supabase';
import {unlink as KakaoUnlink} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

export const deleteAccount = async (provider: string): Promise<void> => {
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

  // 3. DB 삭제
  const {error} = await supabase.rpc('delete_user');
  if (error) throw error;

  // 4. 로컬 세션 종료 (onAuthStateChange가 나머지 정리 처리)
  await supabase.auth.signOut();
};
