import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AuthStack from './AuthStack';
import {useAuth} from '../../contexts/AuthContext';

const RootStack = createNativeStackNavigator();

//루트 네비게이터
const Navigator = () => {
  const {isLoggedIn} = useAuth();
  console.log('✅isLoggedIn', isLoggedIn);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!isLoggedIn ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : (
          <RootStack.Screen name="TabNavigator" component={TabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
