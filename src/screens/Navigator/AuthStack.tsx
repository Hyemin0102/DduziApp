import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Splash from '../Auth/Splash';
import Login from '../Auth/Login';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  //탐색에서 사용하는 네비게이터
  //메인 탐색 페이지, 클릭 시 게시물로 넘어감
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  );
};

export default AuthStack;
