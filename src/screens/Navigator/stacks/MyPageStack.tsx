import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MyPageScreen from '../../MyPage/Mypage';
import ProfileScreen from '../../Profile/Profile';
import {MyPageStackParamList} from '../../../@types/navigation';
import {MY_PAGE_ROUTES, POST_ROUTES} from '@/constants/navigation.constant';
import ProjectsScreen from '@/screens/Projects/ProjectsScreen';
import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import PostCreateForProjectScreen from '@/screens/PostCreate/PostCreateForProjectScreen';
import PostDetailScreen from '@/screens/PostDetail/PostDetailScreen';

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
      <Stack.Screen
        name={MY_PAGE_ROUTES.PROJECTS_MAIN}
        component={ProjectsScreen}
        options={{title: '프로젝트 관리'}}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.PROJECT_DETAIL}
        component={ProjectDetailScreen}
        options={({route}) => ({
          title: route.params?.projectTitle || '프로젝트 상세',
        })}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.CREATE_POST_FOR_PROJECT}
        component={PostCreateForProjectScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={POST_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '게시물 상세'}}
      />
    </Stack.Navigator>
  );
};

export default MyPageStack;
