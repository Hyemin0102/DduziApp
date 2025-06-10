import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/HomeStack';
import DiscoverStack from './stacks/DiscoverStack';
import MyPageStack from './stacks/MyPageStack';
import PostsStack from './stacks/PostsStack';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: '홈',
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="home" color={color} size={size} />
          // ),
        }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverStack}
        options={{
          tabBarLabel: '탐색',
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="search" color={color} size={size} />
          // ),
        }}
      />
      <Tab.Screen
        name="PostTab"
        component={PostsStack}
        options={{
          tabBarLabel: '포스트',
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="search" color={color} size={size} />
          // ),
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageStack}
        options={{
          tabBarLabel: '마이페이지',
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="search" color={color} size={size} />
          // ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
