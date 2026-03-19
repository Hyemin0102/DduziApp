import React from 'react';
import {Image, TouchableOpacity, View, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import HomeScreen from '../../Home/Home';
import PostDetailScreen from '../../PostDetail/PostDetailScreen';
import SearchScreen from '../../Search/Search';
import {HomeStackParamList} from '../../../@types/navigation';
import {HOME_ROUTES, POST_ROUTES} from '../../../constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import PostsScreen from '@/screens/Posts/PostsScreen';
import ProjectDetailScreen from '@/screens/ProjectDetail/ProjectDetailScreen';
import PostCreateForProjectScreen from '@/screens/PostCreate/PostCreateForProjectScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeHeader = () => {
  const {navigation} = useCommonNavigation();

  return (
    <View style={styles.headerContainer}>
      <Image
        source={require('@/assets/images/dduzi_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => navigation.navigate(HOME_ROUTES.SEARCH)}>
        <Icon name="search" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const HomeStack = () => {
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
        headerBackButtonDisplayMode: 'minimal',
        headerBackTitle: '',
      }}>
      <Stack.Screen
        name={HOME_ROUTES.HOME_MAIN}
        component={HomeScreen}
        options={{
          headerTitle: () => <HomeHeader />,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name={HOME_ROUTES.POST_DETAIL}
        component={PostDetailScreen}
        options={{title: '게시물 상세'}}
      />
      <Stack.Screen
        name={HOME_ROUTES.SEARCH}
        component={SearchScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={HOME_ROUTES.POSTS_MAIN}
        component={PostsScreen}
        options={({route}) => ({
          title: route.params?.userId ? '' : '내 뜨개',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name={POST_ROUTES.PROJECT_DETAIL}
        component={ProjectDetailScreen}
        options={({route}) => ({
          title: '',
        })}
      />
      <Stack.Screen
        name={POST_ROUTES.CREATE_POST_FOR_PROJECT}
        component={PostCreateForProjectScreen}
        options={{
          title: '게시물 작성',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 30,
  },
  logo: {
    width: 30,
  },
  searchButton: {},
});

export default HomeStack;
