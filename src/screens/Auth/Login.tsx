import NaverLogin from '@react-native-seoul/naver-login';
import React, {useEffect, useState} from 'react';
import {Button, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../components/contexts/AuthContext';
import {login as KakaoLogin} from '@react-native-seoul/kakao-login';
import {getProfile as KakaoGetProfile} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

import Config from 'react-native-config';
import {initializeKakaoSDK} from '@react-native-kakao/core';
import {
  SocialLoginType,
  UserProfile,
  KakaoUserProfile,
  NaverUserProfile,
  GoogleUserProfile,
} from '../../@types/auth';
import {supabaseAuth, supabaseLocalDB} from '../../lib/supabase';

const KAKAO_SDK = Config.KAKAO_SDK || '';
const NAVER_SCHEME = Config.NAVER_SCHEME || '';
const NAVER_CLIENT_ID = Config.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = Config.NAVER_CLIENT_SECRET || '';
const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = Config.GOOGLE_IOS_CLIENT_ID || '';
const APP_NAME = Config.APP_NAME || '';

// 카카오 프로필 → UserProfile 변환
const convertKakaoProfile = (kakaoProfile: KakaoUserProfile): UserProfile => {
  return {
    id: kakaoProfile.id.toString(),
    name: kakaoProfile.name || kakaoProfile.nickname || undefined,
    email: kakaoProfile.email || undefined,
    profileImage: kakaoProfile.profileImageUrl || undefined,
    nickname: kakaoProfile.nickname || undefined,
    provider: 'kakao',
    rawProfile: kakaoProfile,
  };
};

// 네이버 프로필 → UserProfile 변환
const convertNaverProfile = (naverProfile: NaverUserProfile): UserProfile => {
  return {
    id: naverProfile.id,
    name: naverProfile.name,
    email: naverProfile.email,
    profileImage: naverProfile.profile_image || undefined,
    nickname: naverProfile.nickname || undefined,
    provider: 'naver',
    rawProfile: naverProfile,
  };
};

// 구글 프로필 → UserProfile 변환
const convertGoogleProfile = (
  googleProfile: GoogleUserProfile,
): UserProfile => {
  return {
    id: googleProfile.id,
    name: googleProfile.name,
    email: googleProfile.email,
    profileImage: googleProfile.photo,
    nickname: googleProfile.givenName,
    provider: 'google',
    rawProfile: googleProfile,
  };
};

const Login = () => {
  const {login} = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    //네이버 로그인
    NaverLogin.initialize({
      appName: APP_NAME,
      consumerKey: NAVER_CLIENT_ID,
      consumerSecret: NAVER_CLIENT_SECRET,
      serviceUrlSchemeIOS: NAVER_SCHEME,
      disableNaverAppAuthIOS: true,
    });

    //카카오 로그인
    initializeKakaoSDK(KAKAO_SDK);

    //구글 로그인
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const socialLoginHandle = async (
    loginType: SocialLoginType,
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      let token: string | null = null;
      let userProfile: UserProfile | null = null;

      switch (loginType) {
        case 'naver':
          const {failureResponse, successResponse} = await NaverLogin.login();
          if (successResponse) {
            const profileResult = await NaverLogin.getProfile(
              successResponse.accessToken,
            );
            token = successResponse.accessToken;
            userProfile = convertNaverProfile(
              profileResult.response as NaverUserProfile,
            );
          } else {
            setError(
              `네이버 로그인 실패: ${
                failureResponse?.message || '알 수 없는 오류'
              }`,
            );
            console.log('네이버 로그인 실패:', failureResponse);
            return;
          }
          break;

        case 'kakao':
          try {
            // 1. 카카오 로그인 및 ID 토큰 획득
            const result = await KakaoLogin();
            if (!result) {
              setError('카카오 로그인에 실패했습니다.');
              return;
            }

            console.log('카카오 로그인 성공:', result);

            const kakaoToken = result.idToken;

            // 2. 카카오 프로필 정보 가져오기
            const profile = await KakaoGetProfile();

            // 3. Edge Function 호출: 프로덕션 Supabase에 사용자 인증 정보 및 프로필 Provisioning
            //    (Edge Function 내부에서 로컬 DB 동기화까지 모두 처리됨)
            const {data: authData, error: authError} =
              await supabaseAuth.functions.invoke('kakao-auth', {
                body: {
                  kakaoId: profile.id,
                  email: profile.email || `kakao_${profile.id}@placeholder.com`,
                  username: profile.nickname || `user_${profile.id}`,
                  profileUrl:
                    profile.profileImageUrl || profile.thumbnailImageUrl,
                },
              });

            if (authError) {
              console.error('Edge Function 에러:', authError);
              setError('사용자 정보 저장에 실패했습니다.');
              return;
            }

            console.log('Edge Function 응답:', authData);

            // 4. 카카오 Access Token 사용해 Supabase 세션 설정 (JWT 교환)
            const {data: supabaseAuthData, error: sessionError} =
              await supabaseAuth.auth.signInWithIdToken({
                provider: 'kakao',
                token: kakaoToken,
              });

            if (sessionError) {
              console.error('Supabase 세션 발급 에러:', sessionError);
              setError('세션 발급에 실패했습니다.');
              return;
            }

            if (supabaseAuthData.session) {
              console.log('최종 Supabase 세션 성공:', supabaseAuthData.session);

              const supabaseUserId = supabaseAuthData.session.user.id;
              const userEmail =
                profile.email || `kakao_${profile.id}@placeholder.com`;

              // ⭐️ 관리자 권한 로직 제거 (Edge Function으로 이전됨) ⭐️
              // ⭐️ 1단계: 로컬 DB의 auth.users에 유저 생성 (삭제)
              // ⭐️ 2단계: 로컬 DB의 users 테이블에 프로필 Upsert (삭제)

              // 5. 로컬 DB에서 최종 유저 정보 조회 (일반 사용자 권한만 사용)
              // Edge Function이 로컬 DB를 동기화했으므로, 이제 일반 권한으로 조회 가능
              const {data: profileData, error: profileError} =
                await supabaseLocalDB // ⬅️ 안전한 일반 권한(Anon Key) 클라이언트 사용
                  .from('users')
                  .select('*')
                  .eq('id', supabaseUserId)
                  .single();

              if (profileError) {
                console.error('DB 프로필 조회 에러:', profileError);
                await supabaseAuth.auth.signOut();
                return;
              }
              console.log('DB 프로필', profileData);

              if (profileData) {
                // 6. userProfile 객체 구성 및 로그인 상태 업데이트
                userProfile = {
                  id: profileData.id,
                  email: userEmail,
                  name: profileData.username,
                  profileImage: profileData.avatar_url,
                  provider: 'kakao',
                  rawProfile: profile as KakaoUserProfile,
                  nickname: profileData.username,
                };

                // 최종 로그인 성공 처리
                login(
                  supabaseAuthData.session.access_token,
                  userProfile,
                  'kakao',
                );
              }
            }

            // 7. 로그인 성공
            console.log('로그인 성공:', supabaseAuthData.user);
          } catch (error) {
            console.error('카카오 로그인 에러:', error);
            setError('로그인 처리 중 오류가 발생했습니다.');
          }
          break;

        case 'google':
          await GoogleSignin.hasPlayServices();
          const googleUser = await GoogleSignin.signIn();
          if (googleUser && googleUser.data) {
            token = googleUser.data.idToken || '';
            userProfile = convertGoogleProfile(
              googleUser.data.user as GoogleUserProfile,
            );
          } else {
            setError('구글 로그인에 실패했습니다.');
            console.log('구글 로그인 실패');
            return;
          }
          break;

        default:
          setError('지원하지 않는 로그인 방식입니다.');
          console.error('지원하지 않는 로그인', loginType);
          return;
      }

      if (token && userProfile) {
        await login(token, userProfile, loginType);
      } else {
        setError('로그인 정보를 가져오는데 실패했습니다.');
      }
    } catch (error: any) {
      const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.';
      setError(`${loginType} 로그인 에러: ${errorMessage}`);
      console.error(`${loginType} 로그인 에러:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: 'center',
        }}>
        <View style={{gap: 16}}>
          <Text style={{fontSize: 24, fontWeight: 'bold', textAlign: 'center'}}>
            Dduzi 로그인
          </Text>

          {error && (
            <View
              style={{
                backgroundColor: '#ffe6e6',
                padding: 12,
                borderRadius: 8,
              }}>
              <Text style={{color: '#d32f2f', textAlign: 'center'}}>
                {error}
              </Text>
            </View>
          )}

          <Button
            title={isLoading ? '로그인 중...' : '네이버 로그인'}
            onPress={() => socialLoginHandle('naver')}
            disabled={isLoading}
            color="#03C75A"
          />
          <Button
            title={isLoading ? '로그인 중...' : '카카오 로그인'}
            onPress={() => socialLoginHandle('kakao')}
            disabled={isLoading}
            color="#FEE500"
          />
          <Button
            title={isLoading ? '로그인 중...' : '구글 로그인'}
            onPress={() => socialLoginHandle('google')}
            disabled={isLoading}
            color="#4285F4"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
