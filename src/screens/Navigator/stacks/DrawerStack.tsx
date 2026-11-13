import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DrawerScreen from '@/screens/Drawer/DrawerScreen';
import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import {DrawerStackParamList} from '@/@types/navigation';
import {DRAWER_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import AppHeader from '@/components/Header/AppHeader';
import drawerItemScreens from './drawerItemScreens';

const Stack = createNativeStackNavigator<DrawerStackParamList>();

const DrawerStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({options, navigation}) => (
          <AppHeader
            title={options.title as string}
            titleDirection="left"
            showBack={navigation.canGoBack()}
            onBack={() => navigation.goBack()}
            right={options.headerRight?.({canGoBack: false})}
          />
        ),
      }}>
      <Stack.Screen
        name={DRAWER_ROUTES.DRAWER_MAIN}
        component={DrawerScreen}
        options={{
          header: () => <AppHeader title="서랍장" titleDirection="left" />,
        }}
      />
      {drawerItemScreens(Stack)}
      <Stack.Screen
        name={PROJECTS_ROUTES.PROJECT_DETAIL}
        component={ProjectDetailScreen}
        options={{title: '프로젝트'}}
      />
    </Stack.Navigator>
  );
};

export default DrawerStack;
