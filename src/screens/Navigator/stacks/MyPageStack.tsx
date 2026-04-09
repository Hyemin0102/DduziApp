import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MyPageScreen from '../../MyPage/Mypage';
import ProfileScreen from '../../Profile/Profile';
import SettingsScreen from '../../Settings/Settings';
import {MyPageStackParamList} from '../../../@types/navigation';
import {MY_PAGE_ROUTES, POST_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';

import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import ProjectLogsAllScreen from '@/screens/ProjectDetail/ProjectLogsAllScreen';
import ProjectPostsAllScreen from '@/screens/ProjectDetail/ProjectPostsAllScreen';
import PostCreateForProjectScreen from '@/screens/PostCreate/PostCreateForProjectScreen';
import PostDetailScreen from '@/screens/PostDetail/PostDetailScreen';
import ProjectsScreen from '@/screens/Projects/ProjectsScreen';
import PdfViewerScreen from '@/screens/PdfViewer/PdfViewerScreen';
import InquiryScreen from '@/screens/Inquiry/InquiryScreen';
import TermsOfServiceScreen from '@/screens/TermsOfService/TermsOfServiceScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicy/PrivacyPolicyScreen';
import AppHeader from '@/components/Header/AppHeader';

const Stack = createNativeStackNavigator<MyPageStackParamList>();
const MyPageStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ options, navigation }) => (
          <AppHeader
            title={options.title as string}
            titleDirection="left"
            showBack={navigation.canGoBack()}
            right={options.headerRight?.({canGoBack: false})}
          />
        ),
      }}>
      <Stack.Screen
        name={MY_PAGE_ROUTES.MY_PAGE_MAIN}
        component={MyPageScreen}
        options={{
          header: () => (
            <AppHeader  
              title="마이페이지"
              titleDirection="left"
            />
          ),
        }}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.PROFILE_EDIT}
        component={ProfileScreen}
        options={{title: '프로필 수정'}}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{title: '설정'}}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.INQUIRY}
        component={InquiryScreen}
        options={{title: '문의하기'}}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.TERMS_OF_SERVICE}
        component={TermsOfServiceScreen}
        options={{title: '서비스 이용약관'}}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.PRIVACY_POLICY}
        component={PrivacyPolicyScreen}
        options={{title: '개인정보 처리방침'}}
      />    
    </Stack.Navigator>
  );
};

export default MyPageStack;
