import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MyPageScreen from '../../MyPage/Mypage';

const Stack = createNativeStackNavigator();
const MyPageStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="MyPageMain"
        component={MyPageScreen}
        options={{title: '마이페이지'}}
      />
    </Stack.Navigator>
  );
};

export default MyPageStack;
