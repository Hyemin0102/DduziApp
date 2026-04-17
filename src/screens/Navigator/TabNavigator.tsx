import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/HomeStack';
import MyPageStack from './stacks/MyPageStack';
import PostsStack from './stacks/PostsStack';

import {
  DeviceEventEmitter,
  Platform,
  SafeAreaView,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {SvgProps} from 'react-native-svg';
import {TabParamList} from '../../@types/navigation';
import PostCreateForProjectScreen from '../PostCreate/PostCreateForProjectScreen';
import SearchScreen from '../Search/Search';
import Icon from 'react-native-vector-icons/Feather';
import {TAB_ROUTES} from '@/constants/navigation.constant';
import ProjectsScreen from '../Projects/ProjectsScreen';
import ProjectsStack from './stacks/ProjectsStack';
import HouseSimple from '../../assets/icons/HouseSimple.svg';
import HouseColor from '../../assets/icons/HouseColor.svg';
import PostSimple from '../../assets/icons/PostSimple.svg';
import PostColor from '../../assets/icons/PostColor.svg';
import ProjectSimple from '../../assets/icons/ProjectSimple.svg';
import ProjectColor from '../../assets/icons/ProjectColor.svg';
import MypageSimple from '../../assets/icons/MypageSimple.svg';

type TabIconComponent = React.ComponentType<SvgProps>;

interface TabIconWithLabelProps {
  icon: TabIconComponent;
  activeIcon?: TabIconComponent;
  label: string;
  focused: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
}

const Tab = createBottomTabNavigator<TabParamList>();

const TabIconWithLabel: React.FC<TabIconWithLabelProps> = ({
  icon: SimpleIcon,
  activeIcon: ColorIcon,
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
      {focused && ColorIcon ? (
        <ColorIcon width={size} height={size} />
      ) : (
        <SimpleIcon width={size} height={size} />
      )}
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};

const TabNavigator = () => {
  return (
    <>
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

            ...Platform.select({
              android: {
                height: 70,
              },
            }),
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
                icon={HouseSimple}
                activeIcon={HouseColor}
                label="홈"
                focused={focused}
                size={26}
              />
            ),
          }}
          listeners={({navigation}) => ({
            // tabPress: () => {
            //   if (navigation.isFocused()) {
            //     DeviceEventEmitter.emit('homeTabRepress');
            //   }
            // },
            tabPress: () => {
              const state = navigation.getState();
              const homeRoute = state.routes.find(r => r.name === 'HomeTab');
              const isOnHomeRoot =
                homeRoute?.state?.index === 0 || homeRoute?.state === undefined;

              if (navigation.isFocused() && isOnHomeRoot) {
                // 홈탭의 루트(HomeScreen)에 있을 때만 emit
                DeviceEventEmitter.emit('homeTabRepress');
              }
            },
          })}
        />
        <Tab.Screen
          name="PostTab"
          component={PostsStack}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIconWithLabel
                icon={PostSimple}
                activeIcon={PostColor}
                label="내 뜨개"
                focused={focused}
                size={28}
              />
            ),
          }}
        />
        <Tab.Screen
          name="ProjectsTab"
          component={ProjectsStack}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIconWithLabel
                icon={ProjectSimple}
                activeIcon={ProjectColor}
                label="프로젝트"
                focused={focused}
                size={26}
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
                icon={MypageSimple}
                label="마이페이지"
                focused={focused}
                size={22}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
};

export default TabNavigator;
