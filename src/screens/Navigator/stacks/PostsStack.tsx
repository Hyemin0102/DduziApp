import {createNativeStackNavigator} from '@react-navigation/native-stack';
import PostsScreen from '../../Posts/Posts';

const Stack = createNativeStackNavigator();
const PostsStack = () => {
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
        name="PostsMain"
        component={PostsScreen}
        options={{title: '포스트'}}
      />
    </Stack.Navigator>
  );
};

export default PostsStack;
