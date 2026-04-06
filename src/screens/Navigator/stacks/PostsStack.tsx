// navigation/PostsStack.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import PostsScreen from '@/screens/Posts/PostsScreen';
import PostDetailScreen from '@/screens/PostDetail/PostDetailScreen';
import PostCreateScreen from '@/screens/PostCreate/PostCreateScreen';
import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import ProjectLogsAllScreen from '@/screens/ProjectDetail/ProjectLogsAllScreen';
import ProjectPostsAllScreen from '@/screens/ProjectDetail/ProjectPostsAllScreen';
import PostCreateForProjectScreen from '@/screens/PostCreate/PostCreateForProjectScreen';
import PdfViewerScreen from '@/screens/PdfViewer/PdfViewerScreen';
import {PostsStackParamList} from '@/@types/navigation';
import {MY_PAGE_ROUTES, POST_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import ProfileScreen from '@/screens/Profile/Profile';
import {TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const Stack = createNativeStackNavigator<PostsStackParamList>();

//내 뜨개, 프로젝트 작성, 프로젝트 상세
const PostsStack = () => {
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
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen
        name={POST_ROUTES.POSTS_MAIN}
        component={PostsScreen}
        options={({route, navigation}) => ({
          title: route.params?.userId ? '프로필' : '내 뜨개',
          // headerRight: () =>
          //   !route.params?.userId ? (
          //     <TouchableOpacity
          //       onPress={() =>
          //         navigation.navigate(POST_ROUTES.CREATE_POST_FOR_PROJECT)
          //       }
          //       style={{paddingHorizontal: 4}}>
          //       <Icon name="plus" size={22} color="#333" />
          //     </TouchableOpacity>
          //   ) : null,
        })}
      />
      <Stack.Screen
        name={POST_ROUTES.CREATE_POST}
        component={PostCreateScreen}
        options={{
          title: '프로젝트 작성',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={POST_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '게시물 상세'}}
      />
      <Stack.Screen
        name={POST_ROUTES.PROJECT_DETAIL}
        component={ProjectDetailScreen}
        options={({route}) => ({
          title: '',
        })}
      />
      <Stack.Screen
        name={POST_ROUTES.CREATE_POST_FOR_PROJECT}
        component={PostCreateForProjectScreen}
        options={{
          title: '게시물 작성',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.PROFILE_EDIT}
        component={ProfileScreen}
        options={{title: '프로필 편집'}}
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
