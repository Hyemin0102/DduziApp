import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ExploreScreen from '@/screens/Explore/ExploreScreen';
import PatternDetailScreen from '@/screens/Explore/PatternDetailScreen';
import PatternNotesScreen from '@/screens/Explore/PatternNotesScreen';
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
          header: () => <AppHeader title="Ravelry 도안 탐색" titleDirection="left" />,
        }}
      />
      <Stack.Screen
        name={EXPLORE_ROUTES.PATTERN_DETAIL}
        component={PatternDetailScreen}
        options={({route}) => ({title: route.params?.patternName ?? '도안 상세'})}
      />
      <Stack.Screen
        name={EXPLORE_ROUTES.PATTERN_NOTES}
        component={PatternNotesScreen}
        options={{title: '도안 설명'}}
      />
    </Stack.Navigator>
  );
};

export default ExploreStack;
