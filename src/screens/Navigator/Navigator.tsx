import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {View, ActivityIndicator} from 'react-native';
import TabNavigator from './TabNavigator';
import AuthStack from './stacks/AuthStack';
import {useAuth} from '../../contexts/AuthContext';
import ProfileScreen from '../Profile/Profile';
import TermsAgreementScreen from '../Auth/TermsAgreementScreen';
import OnboardingScreen from '../Onboarding/OnboardingScreen';
import {useRef} from 'react';
import {RootStackParamList} from '../../@types/navigation';
import {ROOT_ROUTES} from '../../constants/navigation.constant';
import {trackScreenView} from '../../lib/mixpanel';
import {
  navigationRef,
  flushPendingNotificationNavigation,
} from '../../lib/navigationRef';

const RootStack = createNativeStackNavigator<RootStackParamList>();

//루트 네비게이터
const Navigator = () => {
  const {isLoggedIn, needsProfileSetup, needsTermsAgreement, isLoading} =
    useAuth();
  const currentScreenNameRef = useRef<string | undefined>(undefined);

  // 초기 인증 상태 확인이 끝나기 전에는 온보딩/홈 분기를 그리지 않음 —
  // 카카오 로그인 중 안드로이드가 액티비티를 재생성해서 AuthContext가 다시
  // 초기화되는 경우에도, 이 화면이 순간적으로 온보딩으로 보이는 걸 방지
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={flushPendingNotificationNavigation}
      onStateChange={() => {
        const currentRoute = navigationRef.getCurrentRoute();
        if (currentRoute?.name && currentRoute.name !== currentScreenNameRef.current) {
          currentScreenNameRef.current = currentRoute.name;
          trackScreenView(currentRoute.name);
        }
      }}>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!isLoggedIn ? (
          // 비로그인 - 온보딩 → 로그인 순서로 스택 구성
          <>
            <RootStack.Screen
              name={ROOT_ROUTES.ONBOARDING}
              component={OnboardingScreen}
            />
            <RootStack.Screen name={ROOT_ROUTES.AUTH} component={AuthStack} />
          </>
        ) : needsTermsAgreement ? (
          // 약관 미동의 — 재설치해도 계정 기준으로 판단하므로 이미 동의한 유저는 안 걸림
          <RootStack.Screen
            name={ROOT_ROUTES.TERMS_AGREEMENT}
            component={TermsAgreementScreen}
          />
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
            {/* <RootStack.Screen
              name="PostCreate"
              component={PostCreateScreen}
              options={{
                headerShown: false,
                title: '뜨개 추가',
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="CreatePostForProject"
              component={PostCreateForProjectScreen}
              options={{
                headerShown: true,
                title: '뜨개 추가',
                headerStyle: {backgroundColor: '#fff'},
                headerTintColor: '#000',
                headerTitleStyle: {fontWeight: 'bold'},
                animation: 'slide_from_bottom',
              }}
            /> */}
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
