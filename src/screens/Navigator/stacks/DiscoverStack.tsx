import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DiscoverScreen from '../../Discover/Discover';

const Stack = createNativeStackNavigator();

const DiscoverStack = () => {
  //탐색에서 사용하는 네비게이터
  //메인 탐색 페이지, 클릭 시 게시물로 넘어감
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
        name="DiscoverMain"
        component={DiscoverScreen}
        options={{title: '탐색'}}
      />
    </Stack.Navigator>
  );
};

export default DiscoverStack;
