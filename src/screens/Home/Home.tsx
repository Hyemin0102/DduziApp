import NaverLogin from '@react-native-seoul/naver-login';
import {Button, Text, View} from 'react-native';
import {useAuth} from '../../components/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';

const Home = () => {
  const {logout} = useAuth();
  const [authToken, setAuthToken] = useState<string | null>('');
  const [user, setUser] = useState<string | null>('');

  const logoutHandle = async (): Promise<void> => {
    try {
      await NaverLogin.logout();
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAsyncStorage();
  }, []);

  const checkAsyncStorage = async () => {
    const authToken = await AsyncStorage.getItem('authToken');
    const user = await AsyncStorage.getItem('user');

    setAuthToken(authToken);
    setUser(user);
  };

  return (
    <View>
      <Text>홈뷰</Text>
      <Text>{authToken}</Text>
      <Text>{user}</Text>
      <Button title={'Logout'} onPress={logoutHandle} />
    </View>
  );
};

export default Home;
