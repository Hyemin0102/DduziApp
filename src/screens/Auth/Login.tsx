import NaverLogin, {
  GetProfileResponse,
  NaverLoginResponse,
} from '@react-native-seoul/naver-login';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {Button, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../components/contexts/AuthContext';

const Login = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const consumerKey = 'bLDWpbNbiBNWzB2r5wke'; //Client ID
  const consumerSecret = 's7sblnRtLc'; //Client Secret
  const appName = '뜨지';
  const {login, logout, isLoggedIn} = useAuth();

  const serviceUrlSchemeIOS = 'com.hyemin.dduziapp.naverlogin'; //URL Scheme

  useEffect(() => {
    NaverLogin.initialize({
      appName,
      consumerKey,
      consumerSecret,
      serviceUrlSchemeIOS,
      disableNaverAppAuthIOS: true,
    });
  }, []);

  const loginHandle = async (): Promise<void> => {
    const {failureResponse, successResponse} = await NaverLogin.login();

    if (successResponse) {
      const profileResult = await NaverLogin.getProfile(
        successResponse!.accessToken,
      );
      console.log('프로필', profileResult);
      console.log('성공 응답', successResponse);

      navigation.reset({
        index: 0, // 현재 활성화된 라우트 인덱스
        routes: [
          // 네비게이션 스택에 들어갈 라우트들
          {
            name: 'TabNavigator',
            state: {
              // TabNavigator 내부 상태
              routes: [
                {
                  name: 'HomeTab',
                  state: {
                    // HomeTab(HomeStack) 내부 상태
                    routes: [{name: 'HomeMain'}],
                    index: 0,
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      });

      await login(successResponse.accessToken, profileResult.response.name);
    } else {
      console.log('실패 응답', failureResponse);
    }
  };

  const logoutHandle = async (): Promise<void> => {
    try {
      await NaverLogin.logout();
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteToken = async (): Promise<void> => {
    try {
      await NaverLogin.deleteToken();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView
      style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{flexGrow: 1, padding: 24}}>
        <Button title={'Login'} onPress={loginHandle} />

        <Button title={'Logout'} onPress={logoutHandle} />

        {isLoggedIn ? (
          <View>
            <Button title="Delete Token" onPress={deleteToken} />
            <Text>로그인 됨</Text>
          </View>
        ) : (
          <View>
            <Text>로그인 안함</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
