import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProjectsScreen from '@/screens/Projects/ProjectsScreen';
import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import ProjectLogsAllScreen from '@/screens/ProjectDetail/ProjectLogsAllScreen';
import ProjectPostsAllScreen from '@/screens/ProjectDetail/ProjectPostsAllScreen';
import PostCreateForProjectScreen from '@/screens/PostCreate/PostCreateForProjectScreen';
import PostDetailScreen from '@/screens/PostDetail/PostDetailScreen';
import PdfViewerScreen from '@/screens/PdfViewer/PdfViewerScreen';
import {ProjectsStackParamList} from '@/@types/navigation';
import {PROJECTS_ROUTES, POST_ROUTES} from '@/constants/navigation.constant';

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

const ProjectsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#fff'},
        headerTintColor: '#000',
        headerTitleStyle: {fontWeight: 'bold'},
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECTS_MAIN}
        component={ProjectsScreen}
        options={{title: '프로젝트'}}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_DETAIL}
        component={ProjectDetailScreen}
        options={() => ({
          title: '',
        })}
      />
      <Stack.Screen
        name={PROJECTS_ROUTES.CREATE_POST_FOR_PROJECT}
        component={PostCreateForProjectScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={POST_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '게시물 상세'}}
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

export default ProjectsStack;
