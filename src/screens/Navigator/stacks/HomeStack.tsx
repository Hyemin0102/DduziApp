import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../../Home/Home';
import {HomeStackParamList} from '../../../@types/navigation';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  //홈에서 사용하는 네비게이터
  //메인홈, 북마크, 즐겨찾는 뜨친, 게시물 상세
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{title: '홈'}}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
