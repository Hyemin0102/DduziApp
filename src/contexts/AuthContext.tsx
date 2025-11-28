import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthContextType,
  AuthProviderProps,
  GoogleUserProfile,
  UserProfile,
} from '../@types/auth';
import {supabaseAuth} from '../lib/supabase';
import {Linking} from 'react-native';
import {logout as KakaoLogout} from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [provider, setProvider] = useState<string>('');
  console.log('✅ user', user);

  const convertSupabaseUserToProfile = (session: any): UserProfile => {
    return {
      id: session.user.id,
      email: session.user.email,
      name:
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name,
      nickname: session.user.user_metadata?.name,
      profileImage:
        session.user.user_metadata?.avatar_url ||
        session.user.user_metadata?.picture,
      provider: session.user.app_metadata.provider || 'google',
      rawProfile: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name,
        picture: session.user.user_metadata?.picture,
        verified_email: session.user.user_metadata?.email_verified,
      } as GoogleUserProfile,
    };
  };

  useEffect(() => {
    checkAuthStatus();

    const {data: authListener} = supabaseAuth.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event);
        console.log('🔔 Auth session:', session);

        if (event === 'SIGNED_IN' && session) {
          const userData = convertSupabaseUserToProfile(session);

          await login(
            session.access_token,
            userData,
            session.user.app_metadata.provider,
          );
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const {
        data: {session},
      } = await supabaseAuth.auth.getSession();

      if (session) {
        console.log('✅ Supabase 세션 확인됨:', session.user);

        const userData = convertSupabaseUserToProfile(session);

        setIsLoggedIn(true);
        setUser(userData);
        setProvider(session.user.app_metadata.provider || 'google');

        await AsyncStorage.setItem('authToken', session.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem(
          'provider',
          session.user.app_metadata.provider || 'google',
        );
      } else {
        // Supabase 세션이 없으면 기존 AsyncStorage 확인 (하위 호환성)
        const authToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');
        const storedProvider = await AsyncStorage.getItem('provider');

        if (authToken && storedUser) {
          setIsLoggedIn(true);
          setUser(JSON.parse(storedUser));
          setProvider(storedProvider || '');
        } else {
          setIsLoggedIn(false);
          setUser(null);
          setProvider('');
        }
      }
    } catch (error) {
      console.log('checkAuthStatus error:', error);
      // 에러 발생 시 로그아웃 상태로
      setIsLoggedIn(false);
      setUser(null);
      setProvider('');
    } finally {
      setIsLoading(false);
    }
  };

  //스토리지 상태 저장
  const login = async (token: any, userData: any, provider: any) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('provider', provider);
    setIsLoggedIn(true);
    setUser(userData);
    setProvider(provider);
  };

  //스토리지 상태 삭제
  const logout = async () => {
    try {
      switch (provider) {
        case 'kakao':
          await supabaseAuth.auth.signOut();
          await KakaoLogout();
          break;
        case 'naver':
          await NaverLogin.logout();
          break;
        case 'google':
          await supabaseAuth.auth.signOut();
          await GoogleSignin.signOut();
          break;
        default:
          break;
      }

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('provider');

      setIsLoggedIn(false);
      setUser(null);
      setProvider('');

      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 에러:', error);
      setIsLoggedIn(false);
      setUser(null);
      setProvider('');

      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('provider');
      } catch (storageError) {
        console.error('❌ AsyncStorage 정리 실패:', storageError);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        isLoading,
        login,
        logout,
        checkAuthStatus,
        provider,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthContext 에러');
  }
  return context;
};

export default AuthProvider;
