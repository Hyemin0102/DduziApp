import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import HomeScreen from '../../Home/Home';
import PostDetailScreen from '../../PostDetail/PostDetailScreen';
import SearchScreen from '../../Search/Search';
import {HomeStackParamList} from '../../../@types/navigation';
import {HOME_ROUTES, POST_ROUTES, PROJECTS_ROUTES} from '../../../constants/navigation.constant';
import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import ProjectLogsAllScreen from '@/screens/ProjectDetail/ProjectLogsAllScreen';
import ProjectPostsAllScreen from '@/screens/ProjectDetail/ProjectPostsAllScreen';
import PostCreateForProjectScreen from '@/screens/PostCreate/PostCreateForProjectScreen';
import PdfViewerScreen from '@/screens/PdfViewer/PdfViewerScreen';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppHeader from '@/components/Header/AppHeader';
import * as S from './HomeStack.style';
import PostsScreen from '@/screens/Posts/PostsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeHeader = () => {
  const {navigation} = useCommonNavigation();
  const insets = useSafeAreaInsets();

  return (
    <S.HeaderContainer paddingTop={insets.top}>
      <S.LogoRow>
        <S.Logo
          source={require('@/assets/images/dduzi_logo.png')}
          resizeMode="contain"
        />
        <S.LogoText
          source={require('@/assets/images/Dduzi_text.png')}
          resizeMode="contain"
        />
      </S.LogoRow>
      <S.SearchButton onPress={() => navigation.navigate(HOME_ROUTES.SEARCH)}>
        <Icon name="search" size={24} color="#333" />
      </S.SearchButton>
    </S.HeaderContainer>
  );
};

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({options, navigation}) => (
          <AppHeader
            title={options.title as string}
            titleDirection="left"
            showBack={navigation.canGoBack()}
          />
        ),
      }}>
      <Stack.Screen
        name={HOME_ROUTES.HOME_MAIN}
        component={HomeScreen}
        options={{
          header: () => <HomeHeader />,
        }}
      />
      <Stack.Screen
        name={POST_ROUTES.POSTS_MAIN}
        component={PostsScreen}
        options={{
         title: '포스트 메인'
        }}
      />
      <Stack.Screen
        name={POST_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '게시물 상세'}}
      />
      <Stack.Screen
        name={HOME_ROUTES.SEARCH}
        component={SearchScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_DETAIL}
        component={ProjectDetailScreen}
        options={{title: '프로젝트 상세'}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_LOGS_ALL}
        component={ProjectLogsAllScreen}
        options={{title: '뜨개 로그'}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_POSTS_ALL}
        component={ProjectPostsAllScreen}
        options={{title: '게시물'}}
      />
      <Stack.Screen
        name={POST_ROUTES.CREATE_POST_FOR_PROJECT}
        component={PostCreateForProjectScreen}
        options={{title: '게시물 작성/수정'}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PDF_VIEWER}
        component={PdfViewerScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
