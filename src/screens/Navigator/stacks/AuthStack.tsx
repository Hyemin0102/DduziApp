import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../../Auth/Login';
import {AuthStackParamList} from '../../../@types/navigation';
import {AUTH_ROUTES} from '@/constants/navigation.constant';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={AUTH_ROUTES.LOGIN} component={Login} />
    </Stack.Navigator>
  );
};

export default AuthStack;
