import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import AuthStack from './stacks/AuthStack';
import {useAuth} from '../../contexts/AuthContext';
import ProfileScreen from '../Profile/Profile';
import {useRef} from 'react';
import {RootStackParamList} from '../../@types/navigation';

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
        console.log('🧭 현재 라우터:', {
          name: currentRoute?.name,
          params: currentRoute?.params,
        });
      }}>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!isLoggedIn ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : needsProfileSetup ? (
          <RootStack.Screen name="Profile" component={ProfileScreen} />
        ) : (
          <RootStack.Screen name="TabNavigator" component={TabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
