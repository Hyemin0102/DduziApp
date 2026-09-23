import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ExploreScreen from '@/screens/Explore/ExploreScreen';
import {ExploreStackParamList} from '@/@types/navigation';
import {EXPLORE_ROUTES} from '@/constants/navigation.constant';
import AppHeader from '@/components/Header/AppHeader';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

const ExploreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({options, navigation}) => (
          <AppHeader
            title={options.title as string}
            titleDirection="left"
            showBack={navigation.canGoBack()}
            onBack={() => navigation.goBack()}
          />
        ),
      }}>
      <Stack.Screen
        name={EXPLORE_ROUTES.EXPLORE_MAIN}
        component={ExploreScreen}
        options={{
          header: () => <AppHeader title="도안 탐색" titleDirection="left" />,
        }}
      />
    </Stack.Navigator>
  );
};

export default ExploreStack;
