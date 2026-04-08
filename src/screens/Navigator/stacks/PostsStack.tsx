// navigation/PostsStack.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import PostsScreen from '@/screens/Posts/PostsScreen';
import PostDetailScreen from '@/screens/PostDetail/PostDetailScreen';
import PostCreateForProjectScreen from '@/screens/PostCreate/PostCreateForProjectScreen';
import {PostsStackParamList} from '@/@types/navigation';
import {MY_PAGE_ROUTES, POST_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import AppHeader from '@/components/Header/AppHeader';
import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import ProjectLogsAllScreen from '@/screens/ProjectDetail/ProjectLogsAllScreen';
import ProjectPostsAllScreen from '@/screens/ProjectDetail/ProjectPostsAllScreen';
import PdfViewerScreen from '@/screens/PdfViewer/PdfViewerScreen';
import ProfileScreen from '@/screens/Profile/Profile';

const Stack = createNativeStackNavigator<PostsStackParamList>();

const PostsStack = () => {
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
        headerShown: true,
      }}>
      <Stack.Screen
        name={POST_ROUTES.POSTS_MAIN}
        component={PostsScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name={POST_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '게시물'}}
      />
   <Stack.Screen
        name={MY_PAGE_ROUTES.PROFILE_EDIT}
        component={ProfileScreen}
        options={{title: '프로필 수정'}}
      />
      <Stack.Screen
        name={POST_ROUTES.CREATE_POST_FOR_PROJECT}
        component={PostCreateForProjectScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_DETAIL}
        component={ProjectDetailScreen}
        options={{title: "프로젝트"}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_LOGS_ALL}
        component={ProjectLogsAllScreen}
        options={{title: '뜨개 로그 전체'}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_POSTS_ALL}
        component={ProjectPostsAllScreen}
        options={{title: '게시물 전체'}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PDF_VIEWER}
        component={PdfViewerScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default PostsStack;
