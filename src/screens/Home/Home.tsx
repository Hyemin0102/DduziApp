import NaverLogin from '@react-native-seoul/naver-login';
import {Button, Text, View} from 'react-native';
import {useAuth} from '../../components/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';
import {logout as KakaoLogout} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

type SocialLoginType = 'naver' | 'kakao' | 'google';

const Home = () => {
  const {logout, provider, user} = useAuth();

  console.log('provider', provider);

  const socialLogoutHandle = async (loginType?: any): Promise<void> => {
    try {
      if (!loginType) {
        await Promise.allSettled([
          logoutFromPlatform('naver'),
          logoutFromPlatform('kakao'),
          logoutFromPlatform('google'),
        ]);
      } else {
        await logoutFromPlatform(loginType);
      }

      // 공통 로그아웃 처리
      await performCommonLogout();
    } catch (error: any) {
      console.error('로그아웃 에러:', error.message);
    }
  };

  const logoutFromPlatform = async (
    platform: SocialLoginType,
  ): Promise<void> => {
    try {
      switch (platform) {
        case 'naver':
          await NaverLogin.logout();
          console.log('네이버 로그아웃 완료');
          break;

        case 'kakao':
          await KakaoLogout();
          console.log('카카오 로그아웃 완료');
          break;

        case 'google':
          await GoogleSignin.signOut();
          console.log('구글 로그아웃 완료');
          break;

        default:
          console.warn('알 수 없는 로그아웃', platform);
      }
    } catch (error: any) {
      console.error(`${platform} 로그아웃 실패:`, error.message);
    }
  };

  const performCommonLogout = async (): Promise<void> => {
    try {
      //스토리지 삭제
      await logout();

      console.log('공통 로그아웃 완료');
    } catch (error: any) {
      console.error('공통 로그아웃 처리 실패:', error.message);
    }
  };

  return (
    <View>
      <Text>홈뷰</Text>

      <Text>{JSON.stringify(user)}</Text>
      <Button title="로그아웃" onPress={() => socialLogoutHandle(provider)} />
    </View>
  );
};

export default Home;
