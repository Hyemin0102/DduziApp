import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../../Home/Home';
import PostDetailScreen from '../../PostDetail/PostDetailScreen';
import {HomeStackParamList} from '../../../@types/navigation';
import {HOME_ROUTES} from '../../../constants/navigation.constant';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  //홈에서 사용하는 네비게이터
  //메인홈, 게시물 상세
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
        name={HOME_ROUTES.HOME_MAIN}
        component={HomeScreen}
        options={{title: '홈'}}
      />
      <Stack.Screen
        name={HOME_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '프로젝트 상세'}}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
