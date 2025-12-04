import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../../Auth/Login';
import {AuthStackParamList} from '../../../@types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  );
};

export default AuthStack;
