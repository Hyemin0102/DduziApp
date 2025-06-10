import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/HomeStack';
import DiscoverStack from './stacks/DiscoverStack';
import MyPageStack from './stacks/MyPageStack';
import PostsStack from './stacks/PostsStack';

import SvgHomeTab from '../../components/Icons/HomeTab';
import SvgDiscoverTab from '../../components/Icons/DiscoverTab';
import SvgMyPageTab from '../../components/Icons/MyPageTab';
import {
  Platform,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {SvgProps} from 'react-native-svg';
import {JSX} from 'react';

interface TabIconComponent {
  (props: SvgProps): JSX.Element;
}

// 커스텀 탭 아이콘 props 타입
interface TabIconWithLabelProps {
  icon: TabIconComponent;
  label: string;
  focused: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
}

const Tab = createBottomTabNavigator();

const TabIconWithLabel: React.FC<TabIconWithLabelProps> = ({
  icon: Icon,
  label,
  focused,
  size = 24,
  activeColor = '#000',
  inactiveColor = '#82879B',
}) => {
  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    width: '100%',
    flex: 1,
  };

  const textStyle: TextStyle = {
    color: focused ? activeColor : inactiveColor,
    fontWeight: focused ? 'bold' : 'normal',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  };

  return (
    <View style={containerStyle}>
      <Icon
        width={size}
        height={size}
        fill={focused ? activeColor : inactiveColor}
      />
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          paddingTop: 14,
          borderTopColor: '#EAEEF4',
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 16,
          },
          shadowOpacity: 0.51,
          shadowRadius: 10.32,
          elevation: 16,
          backgroundColor: '#FFFFFF',
        },
        tabBarItemStyle: {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          marginHorizontal: 2,
        },
        tabBarIconStyle: {
          width: '100%',
          alignItems: 'center',
        },
        tabBarLabel: () => null,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIconWithLabel icon={SvgHomeTab} label="홈" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverStack}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIconWithLabel
              icon={SvgDiscoverTab}
              label="탐색"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="PostTab"
        component={PostsStack}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIconWithLabel
              icon={SvgMyPageTab}
              label="포스트"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageStack}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIconWithLabel
              icon={SvgMyPageTab}
              label="마이페이지"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
