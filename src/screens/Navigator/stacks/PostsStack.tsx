// navigation/PostsStack.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import PostsScreen from '@/screens/Posts/Posts';
import CreatePost from '@/screens/CreatePost/CreatePost';
//import PostDetailScreen from '@/screens/PostDetail/PostDetail';

const Stack = createNativeStackNavigator();

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
        name="PostsMain"
        component={PostsScreen}
        options={{title: '포스트'}}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePost}
        options={{
          title: '프로젝트 작성',
          headerShown: false,
        }}
      />
      {/* <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{title: '프로젝트 상세'}}
      /> */}
    </Stack.Navigator>
  );
};

export default PostsStack;
