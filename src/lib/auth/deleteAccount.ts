import {supabase} from '../supabase';
import {unlink as KakaoUnlink} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

export const deleteAccount = async (provider: string): Promise<void> => {
  // 1. Provider별 연결 끊기 (실패해도 탈퇴 계속 진행)
  try {
    switch (provider) {
      case 'kakao':
        await KakaoUnlink();
        break;

      case 'google':
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        break;

      case 'apple':
        await supabase.functions.invoke('apple-auth', {
          body: {action: 'revoke'},
        });
        break;

      default:
        break;
    }
  } catch (e) {
    console.warn('⚠️ provider 연결 끊기 실패 (탈퇴 계속 진행):', e);
  }

  const {error} = await supabase.rpc('delete_user');
  if (error) throw error;

  // 3. 로컬 세션 종료 (onAuthStateChange가 나머지 정리 처리)
  await supabase.auth.signOut();
};
