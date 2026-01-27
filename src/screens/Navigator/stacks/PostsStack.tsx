// navigation/PostsStack.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import PostsScreen from '@/screens/Posts/PostsScreen';
import PostDetailScreen from '@/screens/PostDetail/PostDetailScreen';
import PostCreateScreen from '@/screens/PostCreate/PostCreateScreen';
import {PostsStackParamList} from '@/@types/navigation';
import {MY_PAGE_ROUTES, POST_ROUTES} from '@/constants/navigation.constant';
import ProfileScreen from '@/screens/Profile/Profile';

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
      }}>
      <Stack.Screen
        name={POST_ROUTES.POSTS_MAIN}
        component={PostsScreen}
        options={({route}) => ({
          title: route.params?.userId ? '프로필' : '내 포스트',
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
        options={{title: '프로젝트 상세'}}
      />
      <Stack.Screen
        name={MY_PAGE_ROUTES.PROFILE_EDIT}
        component={ProfileScreen}
        options={{title: '프로필 편집'}}
      />
    </Stack.Navigator>
  );
};

export default PostsStack;
