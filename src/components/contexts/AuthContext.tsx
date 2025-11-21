import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useContext, useEffect, useState} from 'react';
import React from 'react';
import {
  AuthContextType,
  AuthProviderProps,
  UserProfile,
  SocialLoginType,
} from '../../@types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [provider, setProvider] = useState<SocialLoginType | ''>('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    //로그인 되어있는지 확인
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      const storedProvider = await AsyncStorage.getItem('provider');

      console.log('⭐️authToken', authToken);
      console.log('⭐️storedUser', storedUser);
      console.log('⭐️storedProvider', storedProvider);

      if (authToken && storedUser) {
        setIsLoggedIn(true);
        setUser(JSON.parse(storedUser));
        setProvider((storedProvider as SocialLoginType) || '');
      }
    } catch (error) {
      console.log('checkAuthStatus error:', error);
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
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('provider');
    setIsLoggedIn(false);
    setUser(null);
    setProvider('');
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
