import NaverLogin from '@react-native-seoul/naver-login';
import {Button, Text, View} from 'react-native';
import {useAuth} from '../../components/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';

const Home = () => {
  const {logout} = useAuth();
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
    const user = await AsyncStorage.getItem('user');

    setUser(user);
  };

  return (
    <View>
      <Text>홈뷰</Text>

      <Text>{user}</Text>
      <Button title={'Logout'} onPress={logoutHandle} />
    </View>
  );
};

export default Home;
