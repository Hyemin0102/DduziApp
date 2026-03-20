import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/HomeStack';
import MyPageStack from './stacks/MyPageStack';
import PostsStack from './stacks/PostsStack';

import SvgHomeTab from '../../components/Icons/HomeTab';
import SvgDiscoverTab from '../../components/Icons/DiscoverTab';
import SvgMyPageTab from '../../components/Icons/MyPageTab';
import {Text, TextStyle, TouchableOpacity, View, ViewStyle} from 'react-native';
import {SvgProps} from 'react-native-svg';
import {JSX} from 'react';
import {TabParamList} from '../../@types/navigation';
import PostCreateForProjectScreen from '../PostCreate/PostCreateForProjectScreen';
import SearchScreen from '../Search/Search';
import Icon from 'react-native-vector-icons/Feather';
import {TAB_ROUTES} from '@/constants/navigation.constant';

interface TabIconComponent {
  (props: SvgProps): JSX.Element;
}

interface TabIconWithLabelProps {
  icon: TabIconComponent;
  label: string;
  focused: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
}

const Tab = createBottomTabNavigator<TabParamList>();

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
          paddingTop: 10,
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
            <TabIconWithLabel
              icon={SvgHomeTab}
              label="홈"
              focused={focused}
              size={26}
            />
          ),
        }}
      />
      {/* <Tab.Screen
        name="PostCreatePlaceholder"
        component={PostCreateForProjectScreen}
        options={({navigation}) => ({
          headerShown: true,
          title: '뜨개 추가',
          headerStyle: {backgroundColor: '#fff'},
          headerTintColor: '#000',
          headerTitleStyle: {fontWeight: 'bold'},
          // 탭 바 숨김
          tabBarStyle: {display: 'none'},
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                // navigation history에서 이전 탭으로 이동
                const state = navigation.getState();
                const history = (state as any).history as
                  | {key: string}[]
                  | undefined;
                if (history && history.length > 1) {
                  const prevKey = history[history.length - 2]?.key;
                  const prevRoute = state.routes.find(
                    r => r.key === prevKey,
                  );
                  if (prevRoute) {
                    (navigation as any).navigate(prevRoute.name);
                    return;
                  }
                }
                (navigation as any).navigate('HomeTab');
              }}
              style={{paddingHorizontal: 16}}>
              <Icon name="arrow-left" size={22} color="#000" />
            </TouchableOpacity>
          ),
          tabBarIcon: ({focused}) => (
            <TabIconWithLabel
              icon={SvgDiscoverTab}
              label="뜨개 추가"
              focused={focused}
            />
          ),
        })}
      /> */}
      <Tab.Screen
        name="PostTab"
        component={PostsStack}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIconWithLabel
              icon={SvgDiscoverTab}
              label="내 뜨개"
              focused={focused}
              size={28}
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
              size={22}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
