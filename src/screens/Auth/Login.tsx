import NaverLogin from '@react-native-seoul/naver-login';
import React, {useEffect, useState} from 'react';
import {Button, Linking, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {login as KakaoLogin} from '@react-native-seoul/kakao-login';
import {getProfile as KakaoGetProfile} from '@react-native-seoul/kakao-login';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import Config from 'react-native-config';
import {initializeKakaoSDK} from '@react-native-kakao/core';
import {
  UserProfile,
  KakaoUserProfile,
  NaverUserProfile,
  GoogleUserProfile,
} from '../../@types/auth';
import {supabaseAuth, supabaseLocalDB} from '../../lib/supabase';
import {createOrUpdateUser} from '../../lib/auth/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KAKAO_SDK = Config.KAKAO_SDK || '';
const NAVER_SCHEME = Config.NAVER_SCHEME || '';
const NAVER_CLIENT_ID = Config.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = Config.NAVER_CLIENT_SECRET || '';
const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = Config.GOOGLE_IOS_CLIENT_ID || '';
const APP_NAME = Config.APP_NAME || '';

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

  const socialLoginHandle = async (loginType: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      let finalUserProfile;

      switch (loginType) {
        case 'naver':
          try {
            // 1. 네이버 로그인 및 Access Token 획득 (SDK 사용)
            const {failureResponse, successResponse} = await NaverLogin.login();

            if (!successResponse) {
              setError(
                `네이버 로그인 실패: ${
                  failureResponse?.message || '알 수 없는 오류'
                }`,
              );
              console.log('네이버 로그인 실패:', failureResponse);
              return;
            }

            const naverAccessToken = successResponse.accessToken;

            // 2. 네이버 프로필 정보 가져오기 (SDK로 프로필 정보 미리 확보)
            const profileResult = await NaverLogin.getProfile(naverAccessToken);
            const naverProfile = profileResult.response as NaverUserProfile;

            // 3. Edge Function 호출: Supabase DB 동기화 및 Custom JWT 발급 요청
            const {data: authData, error: authError} =
              await supabaseAuth.functions.invoke('naver-auth', {
                body: {
                  naverAccessToken: naverAccessToken, // ⭐️ Access Token 전달 ⭐️
                },
              });

            if (authError) {
              console.error('Edge Function 에러:', authError);
              setError('사용자 정보 저장 및 토큰 발급에 실패했습니다.');
              return;
            }

            console.log('Edge Function 응답:', authData);
            const customJwt = authData.custom_jwt;

            if (!customJwt) {
              setError('인증 토큰 발급에 실패했습니다.');
              return;
            }

            // 4. Custom JWT를 사용해 Supabase 세션 설정
            const {data: supabaseAuthData, error: sessionError} =
              await supabaseAuth.auth.signInWithIdToken({
                provider: 'kakao', // ⚠️ Custom JWT 사용 시 충돌 방지용 (이전 논의 참조)
                token: customJwt,
              });

            if (sessionError) {
              console.error('Supabase 세션 발급 에러:', sessionError);
              setError('세션 발급에 실패했습니다.');
              return;
            }

            // ⭐️ 세션 성공 블록 시작 ⭐️
            if (supabaseAuthData.session) {
              console.log('최종 Supabase 세션 성공:', supabaseAuthData.session);

              const supabaseUserId = supabaseAuthData.session.user.id;
              const userEmail = naverProfile.email;

              // 5. 로컬 DB에서 최종 유저 정보 조회
              const {data: profileData, error: profileError} =
                await supabaseLocalDB
                  .from('users')
                  .select('*')
                  .eq('id', supabaseUserId)
                  .maybeSingle();

              if (profileError) {
                console.error('DB 프로필 조회 에러:', profileError);
                await supabaseAuth.auth.signOut();
                return;
              }
              console.log('DB 프로필', profileData);

              // 6. finalUserProfile 객체 구성 (토큰, userProfile 변수 할당 제거)
              if (profileData) {
                // DB 데이터가 있는 경우
                finalUserProfile = {
                  id: profileData.id,
                  email: userEmail,
                  name: profileData.username,
                  profileImage: profileData.avatar_url,
                  provider: 'naver', // ⭐️ Provider 명시 ⭐️
                  rawProfile: naverProfile as NaverUserProfile,
                  nickname: profileData.username,
                };
              } else {
                // DB 데이터가 없는 경우 (대체 구성)
                console.warn(
                  '⚠️ users DB 프로필이 없어 네이버 프로필로 구성합니다.',
                );
                finalUserProfile = {
                  id: supabaseUserId,
                  email: userEmail,
                  name: naverProfile.nickname || naverProfile.name,
                  profileImage: naverProfile.profile_image,
                  provider: 'naver',
                  rawProfile: naverProfile as NaverUserProfile,
                  nickname: naverProfile.nickname || naverProfile.name,
                };
              }

              // ⭐️ 7. 로그인 성공 처리 (모든 변수가 유효한 이 블록 안에서 호출) ⭐️
              await login(
                supabaseAuthData.session.access_token,
                finalUserProfile,
                'naver', // loginType은 'naver'
              );

              // 8. 로그인 성공 로그
              console.log('로그인 성공:', supabaseAuthData.user);
              return; // 성공했으므로 여기서 함수를 종료합니다.
            } // ⭐️ if (supabaseAuthData.session) { 블록이 여기서 닫힙니다. ⭐️

            setError('로그인 세션을 확보하지 못했습니다.');
            return;
          } catch (error) {
            console.error('네이버 로그인 에러:', error);
            setError('로그인 처리 중 오류가 발생했습니다.');
            return;
          }

        case 'kakao':
          try {
            const result = await KakaoLogin();

            if (!result) {
              setError('카카오 로그인에 실패했습니다.');
              return;
            }
            const kakaoToken = result.idToken;
            const kakaoProfile = await KakaoGetProfile();

            if (kakaoToken) {
              const {data, error} = await supabaseAuth.auth.signInWithIdToken({
                provider: 'kakao',
                token: kakaoToken,
              });
              console.log('카카오 로그인 데이터', data);

              if (data.user) {
                try {
                  const result = await createOrUpdateUser(data.user, {
                    nickname: kakaoProfile?.nickname,
                    profileImageUrl:
                      kakaoProfile.profileImageUrl ||
                      kakaoProfile.thumbnailImageUrl,
                  });
                  console.log(result);

                  // 신규 사용자면 Profile 화면으로, 기존 사용자면 Home으로
                  if (result.isNewUser) {
                    console.log('🆕 신규 사용자 - Profile 화면으로 이동');
                    // navigation.navigate('Profile', { user: result.user });
                    // 또는 AsyncStorage에 플래그 저장
                    await AsyncStorage.setItem('needsProfileSetup', 'true');
                  } else {
                    console.log('✅ 기존 사용자 - Home으로 이동');
                    await AsyncStorage.removeItem('needsProfileSetup');
                  }
                } catch (userError) {
                  console.error(
                    '⚠️ 사용자 정보 저장 실패 (로그인은 유지):',
                    userError,
                  );
                }
              }
            } else {
              throw new Error('no ID token present!');
            }
          } catch (error: any) {
            console.log('카카오', error);
          }
          break;

        case 'google':
          try {
            await GoogleSignin.hasPlayServices();

            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
              const {data, error} = await supabaseAuth.auth.signInWithIdToken({
                provider: 'google',
                token: userInfo.data?.idToken,
              });
              console.log(error, data);

              if (data.user) {
                try {
                  await createOrUpdateUser(data.user, {
                    nickname: data.user?.user_metadata.full_name,
                    profileImageUrl: data.user?.user_metadata.picture,
                  });
                } catch (userError) {
                  console.error(
                    '⚠️ 사용자 정보 저장 실패 (로그인은 유지):',
                    userError,
                  );
                }
              }
            } else {
              throw new Error('no ID token present!');
            }
          } catch (error: any) {
            console.log('구글', error);

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
              // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
              // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
              // play services not available or outdated
            } else {
              // some other error happened
            }
          }
          break;

        default:
          setError('지원하지 않는 로그인 방식입니다.');
          console.error('지원하지 않는 로그인', loginType);
          return;
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

          {/* <Button
            title={isLoading ? '로그인 중...' : '네이버 로그인'}
            onPress={() => socialLoginHandle('naver')}
            disabled={isLoading}
            color="#03C75A"
          /> */}
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
