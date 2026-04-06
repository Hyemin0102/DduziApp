import React, {useEffect, useState} from 'react';
import * as S from './Login.style';
import {Alert, ActivityIndicator} from 'react-native';
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
import appleAuth from '@invertase/react-native-apple-authentication';

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
const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = Config.GOOGLE_IOS_CLIENT_ID || '';

const Login = () => {
  const {login, setNeedsProfileSetup} = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

              if (error) throw error;

              if (data.user && data.session) {
                try {
                  //DB 저장(auth에서 받은 유저데이터, 카카오에서 받은 프로필 보냄)
                  //삽입한 user테이블 데이터, 신규 유저 여부 리턴
                  const result = await createOrUpdateUser(data.user, {
                    nickname: kakaoProfile?.nickname,
                    profileImageUrl:
                      kakaoProfile.profileImageUrl ||
                      kakaoProfile.thumbnailImageUrl,
                  }, 'kakao');
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
                } catch (userError: any) {
                  if (userError?.message?.startsWith('PROVIDER_CONFLICT:')) {
                    const conflictProvider = userError.message.split(':')[1];
                    await supabase.auth.signOut();
                    Alert.alert(
                      '이미 가입된 계정',
                      `이 이메일은 이미 ${conflictProvider} 계정으로 가입되어 있습니다.\n${conflictProvider}로 로그인해 주세요.`,
                    );
                  } else {
                    console.error('⚠️ 사용자 정보 저장 실패 (로그인은 유지):', userError);
                  }
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

              if (error) throw error;

              if (data.user && data.session) {
                try {
                  const result = await createOrUpdateUser(data.user, {
                    nickname: data.user?.user_metadata.full_name,
                    profileImageUrl: data.user?.user_metadata.picture,
                  }, 'google');
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
                } catch (userError: any) {
                  if (userError?.message?.startsWith('PROVIDER_CONFLICT:')) {
                    const conflictProvider = userError.message.split(':')[1];
                    await supabase.auth.signOut();
                    Alert.alert(
                      '이미 가입된 계정',
                      `이 이메일은 이미 ${conflictProvider} 계정으로 가입되어 있습니다.\n${conflictProvider}로 로그인해 주세요.`,
                    );
                  } else {
                    console.error('⚠️ 사용자 정보 저장 실패 (로그인은 유지):', userError);
                  }
                }
              }
            } else {
              throw new Error('no ID token present!');
            }
          } catch (error: any) {
            console.log('구글 error', error);
          }
          break;

        case 'apple':
          try {
            const rawNonce = Array.from({length: 32}, () =>
              'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
                Math.floor(Math.random() * 62),
              ),
            ).join('');

            const appleAuthRequestResponse = await appleAuth.performRequest({
              requestedOperation: appleAuth.Operation.LOGIN,
              requestedScopes: [
                appleAuth.Scope.FULL_NAME,
                appleAuth.Scope.EMAIL,
              ],
              nonce: rawNonce,
            });

            const {identityToken, authorizationCode, fullName, email} = appleAuthRequestResponse;
            console.log('fullname email:', fullName, email);

            if (!identityToken) {
              throw new Error('no identity token present!');
            }

            const {data, error} = await supabase.auth.signInWithIdToken({
              provider: 'apple',
              token: identityToken,
              nonce: rawNonce,
            });

            if (error) throw error;

            if (data.user && data.session) {
              try {
                const appleFullName = fullName
                  ? [fullName.givenName, fullName.familyName]
                      .filter(Boolean)
                      .join(' ')
                  : undefined;

                const result = await createOrUpdateUser(data.user, {
                  nickname:
                    appleFullName ||
                    data.user.user_metadata?.full_name ||
                    email ||
                    undefined,
                }, 'apple');
                console.log('애플 로그인 결과', result);

                const userProfile = createUserProfile({
                  supabaseUser: data.user,
                  dbUser: result.user,
                  provider: 'apple',
                  rawProfile: {
                    id: data.user.id,
                    email: email || data.user.email,
                    fullName: appleFullName,
                  },
                });

                await login(data.session.access_token, userProfile, 'apple');

                // authorization_code → refresh_token 교환 후 저장 (탈퇴 시 revoke에 사용)
                // authorization_code는 5분 내에만 유효하므로 로그인 직후 처리
                if (authorizationCode) {
                  const {error: exchangeError} = await supabase.functions.invoke('apple-auth', {
                    body: {action: 'exchange', authorization_code: authorizationCode},
                  });
                  if (exchangeError) {
                    console.warn('Apple token exchange 실패 - 탈퇴 시 revoke가 동작하지 않을 수 있습니다:', exchangeError);
                  }
                }

                if (result.isNewUser) {
                  await AsyncStorage.setItem('needsProfileSetup', 'true');
                  setNeedsProfileSetup(true);
                } else {
                  await AsyncStorage.removeItem('needsProfileSetup');
                  setNeedsProfileSetup(false);
                }
              } catch (userError: any) {
                if (userError?.message?.startsWith('PROVIDER_CONFLICT:')) {
                  const conflictProvider = userError.message.split(':')[1];
                  await supabase.auth.signOut();
                  Alert.alert(
                    '이미 가입된 계정',
                    `이 이메일은 이미 ${conflictProvider} 계정으로 가입되어 있습니다.\n${conflictProvider}로 로그인해 주세요.`,
                  );
                } else {
                  console.error('⚠️ 사용자 정보 저장 실패 (로그인은 유지):', userError);
                }
              }
            }
          } catch (error: any) {
            if (error.code === appleAuth.Error.CANCELED) {
              console.log('애플 로그인 취소됨');
            } else {
              console.log('애플 error', error);
            }
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
    <S.Container>
      <S.ScrollViewContainer
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        {isLoading && (
          <S.LoadingOverlay>
            <ActivityIndicator size="large" color="#888888" />
          </S.LoadingOverlay>
        )}
        <S.InnerContainer>
          <S.TopContent>
            <S.LogoImage source={require('../../assets/images/dduzi_logo.png')} />
            <S.TextImage source={require('../../assets/images/Dduzi_text.png')} />
            {/* <S.SubTitle>오늘 뭐 뜨지?</S.SubTitle> */}
            {/* <S.SubTitleAccent>오늘 뭐 뜨지?</S.SubTitleAccent> */}
          </S.TopContent>

          <S.ButtonContainer>
            {error && (
              <S.ErrorBox>
                <S.ErrorText>{error}</S.ErrorText>
              </S.ErrorBox>
            )}

            <S.SocialButton
              provider="kakao"
              onPress={() => socialLoginHandle('kakao')}
              disabled={isLoading}
              activeOpacity={0.8}>
              <S.ButtonInner>
                <S.ButtonIcon source={require('../../assets/images/kakao_icon.png')} />
                <S.ButtonText provider="kakao">카카오로 시작하기</S.ButtonText>
              </S.ButtonInner>
            </S.SocialButton>

            <S.SocialButton
              provider="google"
              onPress={() => socialLoginHandle('google')}
              disabled={isLoading}
              activeOpacity={0.8}>
              <S.ButtonInner>
                <S.ButtonIcon source={require('../../assets/images/google_icon.png')} />
                <S.ButtonText provider="google">구글로 시작하기</S.ButtonText>
              </S.ButtonInner>
            </S.SocialButton>

            <S.SocialButton
              provider="apple"
              onPress={() => socialLoginHandle('apple')}
              disabled={isLoading}
              activeOpacity={0.8}>
              <S.ButtonInner>
                <S.ButtonIcon source={require('../../assets/images/apple_icon.png')} />
                <S.ButtonText provider="apple">애플로 시작하기</S.ButtonText>
              </S.ButtonInner>
            </S.SocialButton>
          </S.ButtonContainer>
        </S.InnerContainer>
      </S.ScrollViewContainer>
    </S.Container>
  );
};

export default Login;
