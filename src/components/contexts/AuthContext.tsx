import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Children,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import React from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  user: string;
  isLoading: boolean;
  login: (token: any, userData: any, provider: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  provider: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [provider, setProvider] = useState<string>('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    //로그인 되어있는지 확인
    const authToken = await AsyncStorage.getItem('authToken');
    console.log('⭐️authToken', authToken);

    try {
      if (authToken && user) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  //스토리지 상태 저장
  const login = async (token: any, userData: any, provider: any) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
    setProvider(provider);
  };

  //스토리지 상태 삭제
  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser('');
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
