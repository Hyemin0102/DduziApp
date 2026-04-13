import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContextType, AuthProviderProps, UserProfile} from '../@types/auth';
import {supabase} from '../lib/supabase';
import {logout as KakaoLogout} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [provider, setProvider] = useState<string>('');
  const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean>(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  console.log('✅ Authuser', user);

  //supabase 테이블 + users 테이블
  const fetchUserWithProfile = async (session: any): Promise<UserProfile> => {
    const {data: dbUser, error} = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    console.log('🥳session', session);

    if (error) {
      console.error('❌ users 테이블 조회 에러:', error);
    }

    const provider = session.user.app_metadata.provider;
    const metadata = session.user.user_metadata;

    // provider별 rawProfile 생성 (id만 저장, 나중에 필요하면 확장 가능)
    let rawProfile: {id: string | number};

    switch (provider) {
      case 'kakao':
        rawProfile = {
          id: Number(metadata?.provider_id) || 0,
        };
        break;

      case 'google':
      default:
        rawProfile = {
          id: session.user.id,
        };
        break;
    }

    //users 테이블
    return {
      id: session.user.id,
      email: session.user.email,
      nickname: dbUser?.nickname || metadata?.name,  // DB에 저장된 닉네임 또는 OAuth 이름(최초 로그인 시)
      bio: dbUser?.bio || null,
      profile_image: dbUser?.profile_image || null,
      provider: provider,
      rawProfile: rawProfile as any,
    };
  };

  useEffect(() => {
    checkAuthStatus();

    const {data: authListener} = supabase.auth.onAuthStateChange(
      async event => {
        // 로그아웃 감지 - 모든 상태 초기화를 여기서 일괄 처리
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUser(null);
          setProvider('');
          setNeedsProfileSetup(false);
          //setHasSeenOnboarding(false);

          // AsyncStorage 정리
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('provider');
          await AsyncStorage.removeItem('needsProfileSetup');
          //await AsyncStorage.removeItem('onboarding_completed');
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    setHasSeenOnboarding(true);
  };

  const checkAuthStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      setHasSeenOnboarding(onboardingCompleted === 'true');

      const {
        data: {session},
      } = await supabase.auth.getSession();

      if (!supabase || !supabase.auth) {
        console.error('❌ Supabase 클라이언트가 초기화되지 않음!');
        setIsLoading(false);
        return;
      }

      if (session) {
        const userData = await fetchUserWithProfile(session);

        setIsLoggedIn(true);
        setUser(userData);
        setProvider(session.user.app_metadata.provider || 'google');

        await AsyncStorage.setItem('authToken', session.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem(
          'provider',
          session.user.app_metadata.provider || 'google',
        );

        // needsProfileSetup 플래그 확인
        const needsSetup = await AsyncStorage.getItem('needsProfileSetup');
        setNeedsProfileSetup(needsSetup === 'true');
      } else {
        // Supabase 세션이 없으면 기존 AsyncStorage 확인
        const authToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');
        const storedProvider = await AsyncStorage.getItem('provider');

        if (authToken && storedUser) {
          setIsLoggedIn(true);
          setUser(JSON.parse(storedUser));
          setProvider(storedProvider || '');

          // needsProfileSetup 플래그 확인
          const needsSetup = await AsyncStorage.getItem('needsProfileSetup');
          setNeedsProfileSetup(needsSetup === 'true');
        } else {
          setIsLoggedIn(false);
          setUser(null);
          setProvider('');
          setNeedsProfileSetup(false);
        }
      }
    } catch (error) {
      console.error('checkAuthStatus error:', error);
      setIsLoggedIn(false);
      setUser(null);
      setProvider('');
      setNeedsProfileSetup(false);
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

  // 사용자 프로필 업데이트 (로컬 상태만)
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = {...user, ...updates};

    setUser(updatedUser);
    // AsyncStorage도 업데이트
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('AsyncStorage 업데이트 실패:', error);
    }
  };

  //스토리지 상태 삭제
  const logout = async () => {
    try {
      // provider별 로그아웃 처리
      switch (provider) {
        case 'kakao':
          await KakaoLogout();
          break;
        case 'google':
          await GoogleSignin.signOut();
          break;
        case 'apple':
          // Apple Sign In은 별도 SDK 로그아웃 없이 Supabase signOut으로 처리
          break;
        default:
          break;
      }

      // Supabase 로그아웃 - 이후 onAuthStateChange에서 상태 초기화 처리
      await supabase.auth.signOut();

      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 에러:', error);

      // 에러 발생 시 강제로 상태 초기화
      setIsLoggedIn(false);
      setUser(null);
      setProvider('');
      setNeedsProfileSetup(false);

      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('❌ Supabase signOut 실패:', signOutError);
      }

      try {
        await AsyncStorage.multiRemove(['authToken', 'user', 'provider', 'needsProfileSetup']);
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
        needsProfileSetup,
        hasSeenOnboarding,
        completeOnboarding,
        updateUserProfile,
        setNeedsProfileSetup,
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
