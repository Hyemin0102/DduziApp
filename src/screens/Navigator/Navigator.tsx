import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AuthStack from './AuthStack';
import {useAuth} from '../../contexts/AuthContext';
import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileScreen from '../Profile/Profile';
//import ProfileScreen from '../Profile/Profile';

const RootStack = createNativeStackNavigator();

//루트 네비게이터
const Navigator = () => {
  const {isLoggedIn, user} = useAuth();
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    const checkProfileSetup = async () => {
      const flag = await AsyncStorage.getItem('needsProfileSetup');
      setNeedsProfileSetup(flag === 'true');
    };

    if (isLoggedIn) {
      checkProfileSetup();
    }
  }, [isLoggedIn]);

  return (
    <NavigationContainer>
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
