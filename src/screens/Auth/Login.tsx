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
import {
  supabaseAuth,
  supabaseLocalAdminDB,
  supabaseLocalDB,
} from '../../lib/supabase';
import {useNavigation} from '@react-navigation/native';
import {MAIN_ROUTES, ROOT_ROUTES} from '../../@types/route';

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
            // 1. 카카오 로그인
            const result = await KakaoLogin();
            if (!result) {
              setError('카카오 로그인에 실패했습니다.');
              return;
            }

            console.log('카카오 로그인 성공:', result);

            const kakaoToken = result.idToken;

            // 2. 프로필 가져오기
            const profile = await KakaoGetProfile();

            // 3. Edge Function 호출하여 Supabase에 사용자 저장
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

            //4. 카카오 Access Token 사용해 세션 설정
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

              // ⭐️ 1단계: 로컬 DB의 auth.users에 유저 생성 (관리자 권한 필요) ⭐️
              // 이 로직은 Auth의 FK 제약 조건을 만족시키기 위해 '필수'입니다.
              // 기존 유저/신규 유저 모두 로컬 DB에는 처음 접근할 수 있으므로 유지합니다.
              const {data: localUser, error: authAdminError} =
                await supabaseLocalAdminDB.auth.admin.createUser({
                  email: userEmail,
                  id: supabaseUserId,
                  email_confirm: true,
                });

              if (authAdminError && authAdminError.status !== 409) {
                // 409는 이미 존재하는 에러
                console.warn('로컬 Auth 유저 생성 오류:', authAdminError);
              }

              // ⭐️ 2단계: 로컬 DB의 users 테이블에 프로필 Upsert (관리자 권한으로 강제 저장) ⭐️
              // 로컬 환경의 DB가 프로덕션 Auth와 분리되어 있으므로, 이 로직은 필수입니다.
              const {error: upsertError} = await supabaseLocalAdminDB
                .from('users')
                .upsert(
                  {
                    id: supabaseUserId,
                    username: profile.nickname || `user_${profile.id}`,
                    avatar_url:
                      profile.profileImageUrl || profile.thumbnailImageUrl,
                    last_username_update: new Date().toISOString(), // DB에 이 컬럼이 Not Null이면 추가해야 합니다.
                  },
                  {onConflict: 'id'},
                );

              if (upsertError) {
                console.error('로컬 DB Upsert 에러:', upsertError);
                return;
              }

              //DB에서 유저정보 가져옴
              const {data: profileData, error: profileError} =
                await supabaseLocalDB
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
                // ⭐️ 3단계: userProfile 객체 할당 수정 ⭐️
                userProfile = {
                  id: profileData.id,
                  email: userEmail,
                  name: profileData.username,
                  profileImage: profileData.avatar_url,
                  provider: 'kakao',
                  rawProfile: profile as KakaoUserProfile,
                  nickname: profileData.username,
                };
                // 로그인 성공 및 상태 업데이트 로직 호출 (login 함수)
                login(
                  supabaseAuthData.session.access_token, // 발급받은 액세스 토큰
                  userProfile, // DB에서 가져온 최신 프로필 데이터
                  'kakao',
                );
              }
            }

            // 5. 로그인 성공
            console.log('로그인 성공:', authData.user);
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
