import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DiscoverScreen from '../../Discover/Discover';
import {DiscoverStackParamList} from '../../../@types/navigation';
import {DISCOVER_ROUTES, HOME_ROUTES} from '@/constants/navigation.constant';
import PostDetailScreen from '@/screens/PostDetail/PostDetailScreen';

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

const DiscoverStack = () => {
  //탐색에서 사용하는 네비게이터
  //메인 탐색 페이지, 클릭 시 게시물로 넘어감
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
        name={DISCOVER_ROUTES.DISCOVER_MAIN}
        component={DiscoverScreen}
        options={{title: '탐색'}}
      />
        <Stack.Screen
        name={DISCOVER_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '프로젝트 상세'}}
      />
    </Stack.Navigator>
  );
};

export default DiscoverStack;
