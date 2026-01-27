import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import AuthStack from './stacks/AuthStack';
import {useAuth} from '../../contexts/AuthContext';
import ProfileScreen from '../Profile/Profile';
import {useRef} from 'react';
import {RootStackParamList} from '../../@types/navigation';
import {ROOT_ROUTES} from '../../constants/navigation.constant';
import PostCreateScreen from '../PostCreate/PostCreateScreen';
import {Title} from '../PostDetail/PostDetailScreen.styles';

const RootStack = createNativeStackNavigator<RootStackParamList>();

//루트 네비게이터
const Navigator = () => {
  const {isLoggedIn, needsProfileSetup} = useAuth();
  const navigationRef = useRef<any>(null);

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        console.log('🧭 현재 라우터:', currentRoute?.name);
      }}>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!isLoggedIn ? (
          //비회원
          <RootStack.Screen name={ROOT_ROUTES.AUTH} component={AuthStack} />
        ) : needsProfileSetup ? (
          // 최초 로그인
          <RootStack.Screen
            name={ROOT_ROUTES.PROFILE}
            component={ProfileScreen}
          />
        ) : (
          <>
            <RootStack.Screen
              name={ROOT_ROUTES.TAB_NAVIGATOR}
              component={TabNavigator}
            />
            <RootStack.Screen
              name="PostCreate"
              component={PostCreateScreen}
              options={{
                headerShown: false,
                title: '뜨개 추가',
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
