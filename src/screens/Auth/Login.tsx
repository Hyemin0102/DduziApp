import NaverLogin, {
  GetProfileResponse,
  NaverLoginResponse,
} from '@react-native-seoul/naver-login';
import React, {useEffect, useState} from 'react';
import {Button, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const Login = () => {
  const consumerKey = 'bLDWpbNbiBNWzB2r5wke';
  const consumerSecret = 's7sblnRtLc';
  const appName = '뜨지';

  const serviceUrlSchemeIOS = 'com.hyemin.dduziapp.naverlogin';

  useEffect(() => {
    NaverLogin.initialize({
      appName,
      consumerKey,
      consumerSecret,
      serviceUrlSchemeIOS,
      disableNaverAppAuthIOS: true,
    });
  }, []);

  const [success, setSuccessResponse] =
    useState<NaverLoginResponse['successResponse']>();

  const [failure, setFailureResponse] =
    useState<NaverLoginResponse['failureResponse']>();

  const login = async (): Promise<void> => {
    const {failureResponse, successResponse} = await NaverLogin.login();
    setSuccessResponse(successResponse);
    setFailureResponse(failureResponse);
    if (successResponse) {
      const profileResult = await NaverLogin.getProfile(
        successResponse!.accessToken,
      );
      console.log(profileResult);
    } else {
      console.log(failureResponse);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await NaverLogin.logout();
      setSuccessResponse(undefined);
      setFailureResponse(undefined);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteToken = async (): Promise<void> => {
    try {
      await NaverLogin.deleteToken();
      setSuccessResponse(undefined);
      setFailureResponse(undefined);
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
        <Button title={'Login'} onPress={login} />

        <Button title={'Logout'} onPress={logout} />

        {success ? (
          <View>
            <Button title="Delete Token" onPress={deleteToken} />
            <Text>로그인 성공</Text>
          </View>
        ) : null}

        {failure ? (
          <View>
            <Text>로그인 실패</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
