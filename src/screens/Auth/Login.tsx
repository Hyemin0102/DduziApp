import NaverLogin from '@react-native-seoul/naver-login';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {Button, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../components/contexts/AuthContext';
import {initializeKakaoSDK} from '@react-native-kakao/core';
import {login as KakaoLogin} from '@react-native-seoul/kakao-login';
import {logout as KakaoLogout} from '@react-native-seoul/kakao-login';
import {getProfile as KakaoGetProfile} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';

const KAKAO_SDK = Config.KAKAO_SDK || '';
const NAVER_SCHEME = Config.NAVER_SCHEME || '';
const GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID || '';
const NAVER_CLIENT_ID = Config.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = Config.NAVER_CLIENT_SECRET || '';
const APP_NAME = Config.APP_NAME || '';

type SocialLoginType = 'naver' | 'kakao' | 'google';

const Login = () => {
  const {login} = useAuth();

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
      webClientId: GOOGLE_CLIENT_ID,
      iosClientId: GOOGLE_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const socialLoginHandle = async (
    loginType: SocialLoginType,
  ): Promise<void> => {
    try {
      let token: string | null = null;
      let userProfile: any = null;

      switch (loginType) {
        case 'naver':
          const {failureResponse, successResponse} = await NaverLogin.login();
          if (successResponse) {
            const profileResult = await NaverLogin.getProfile(
              successResponse!.accessToken,
            );
            token = successResponse.accessToken;
            userProfile = profileResult.response;
          } else {
            console.log('네이버 로그인 실패:', failureResponse);
            return;
          }
          break;

        case 'kakao':
          const result = await KakaoLogin();
          if (result) {
            const profile = await KakaoGetProfile();
            token = result.accessToken;
            userProfile = profile;
          } else {
            console.log('카카오 로그인 실패');
          }
          break;

        case 'google':
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
          const {type, data} = await GoogleSignin.signIn();
          if (type === 'success') {
            token = data.idToken;
            userProfile = data.user;
          } else if (type === 'cancelled') {
            console.log('구글 로그인 취소');
            return;
          } else {
            console.log('구글 로그인 실패');
            return;
          }
          break;

        default:
          console.error('지원하지 않는 로그인', loginType);
          return;
      }

      if (token && userProfile && loginType) {
        await login(token, userProfile, loginType);
      }
    } catch (error: any) {
      console.error(`${loginType} 로그인 에러:`, error.message);
    }
  };

  return (
    <SafeAreaView
      style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{flexGrow: 1, padding: 24}}>
        <Button
          title={'NaverLogin'}
          onPress={() => socialLoginHandle('naver')}
        />
        <Button
          title={'KakaoLogin'}
          onPress={() => socialLoginHandle('kakao')}
        />
        <Button
          title={'GoogleLogin'}
          onPress={() => socialLoginHandle('google')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
