import NaverLogin from '@react-native-seoul/naver-login';
import React, {useEffect, useState} from 'react';
import {Button, Linking, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {
  login as KakaoLogin,
  getProfile as KakaoGetProfile,
} from '@react-native-seoul/kakao-login';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import Config from 'react-native-config';
import {initializeKakaoSDK} from '@react-native-kakao/core';
// 라이브러리 타입을 직접 사용
import type {KakaoProfile} from '@react-native-seoul/kakao-login';
import type {User as GoogleUser} from '@react-native-google-signin/google-signin';
import {supabase, supabaseLocalDB} from '../../lib/supabase';
import {
  createOrUpdateUser,
  createUserProfile,
} from '../../lib/auth/userService';

import AsyncStorage from '@react-native-async-storage/async-storage';

const KAKAO_SDK = Config.KAKAO_SDK || '';
const NAVER_SCHEME = Config.NAVER_SCHEME || '';
const NAVER_CLIENT_ID = Config.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = Config.NAVER_CLIENT_SECRET || '';
const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = Config.GOOGLE_IOS_CLIENT_ID || '';
const APP_NAME = Config.APP_NAME || '';

const Login = () => {
  const {login, setNeedsProfileSetup} = useAuth();
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
      forceCodeForRefreshToken: true,
    });
  }, []);

  const socialLoginHandle = async (loginType: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      switch (loginType) {
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
              const {data, error} = await supabase.auth.signInWithIdToken({
                provider: 'kakao',
                token: kakaoToken,
              });

              if (data.user && data.session) {
                try {
                  //DB 저장(auth에서 받은 유저데이터, 카카오에서 받은 프로필 보냄)
                  //삽입한 user테이블 데이터, 신규 유저 여부 리턴
                  const result = await createOrUpdateUser(data.user, {
                    nickname: kakaoProfile?.nickname,
                    profileImageUrl:
                      kakaoProfile.profileImageUrl ||
                      kakaoProfile.thumbnailImageUrl,
                  });
                  console.log('카카오 로그인 결과', result);

                  // UserProfile 객체 구성
                  const userProfile = createUserProfile({
                    supabaseUser: data.user,
                    dbUser: result.user,
                    provider: 'kakao',
                    rawProfile: kakaoProfile as KakaoProfile,
                  });

                  // login 함수 호출
                  await login(data.session.access_token, userProfile, 'kakao');

                  // 신규 사용자면 Profile 화면으로, 기존 사용자면 Home으로
                  if (result.isNewUser) {
                    await AsyncStorage.setItem('needsProfileSetup', 'true');
                    setNeedsProfileSetup(true);
                  } else {
                    await AsyncStorage.removeItem('needsProfileSetup');
                    setNeedsProfileSetup(false);
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
            console.log('카카오 error', error);
          }
          break;

        case 'google':
          try {
            await GoogleSignin.hasPlayServices();

            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
              const {data, error} = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: userInfo.data?.idToken,
              });

              if (data.user && data.session) {
                try {
                  const result = await createOrUpdateUser(data.user, {
                    nickname: data.user?.user_metadata.full_name,
                    profileImageUrl: data.user?.user_metadata.picture,
                  });
                  console.log('구글 로그인 결과', result);

                  // UserProfile 객체 구성
                  const userProfile = createUserProfile({
                    supabaseUser: data.user,
                    dbUser: result.user,
                    provider: 'google',
                    rawProfile: {
                      id: data.user.id,
                    } as GoogleUser['user'],
                  });

                  // login 함수 호출
                  await login(data.session.access_token, userProfile, 'google');

                  if (result.isNewUser) {
                    await AsyncStorage.setItem('needsProfileSetup', 'true');
                    setNeedsProfileSetup(true);
                  } else {
                    await AsyncStorage.removeItem('needsProfileSetup');
                    setNeedsProfileSetup(false);
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
            console.log('구글 error', error);
          }
          break;

        default:
          setError('지원하지 않는 로그인 방식입니다.');
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
