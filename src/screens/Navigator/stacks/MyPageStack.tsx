import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MyPageScreen from '../../MyPage/Mypage';
import ProfileScreen from '../../Profile/Profile';
import {MyPageStackParamList} from '../../../@types/navigation';
import {MY_PAGE_ROUTES} from '@/constants/navigation.constant';

const Stack = createNativeStackNavigator<MyPageStackParamList>();
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
        name={MY_PAGE_ROUTES.MY_PAGE_MAIN}
        component={MyPageScreen}
        options={{title: '마이페이지'}}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.PROFILE_EDIT}
        component={ProfileScreen}
        options={{title: '프로필 편집'}}
      />
    </Stack.Navigator>
  );
};

export default MyPageStack;
