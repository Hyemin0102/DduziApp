import React, {useState, useCallback} from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ScrollViewComponent,
  Dimensions,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import * as S from './Home.style';
import {useAuth} from '../../contexts/AuthContext';
import UserProfileCard from '../../components/UserProfileCard';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {HOME_ROUTES} from '@/constants/navigation.constant';
import {HomeStackNavigationProp} from '@/@types/navigation';

interface PostImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface Post {
  id: string;
  title: string;
  createdAt: string;
  patternUrl: string | null;
  username: string;
  profile_image: string;
  images: PostImage[];
  content: string;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const {navigation} = useCommonNavigation<HomeStackNavigationProp>();
  const fetchPosts = async () => {
    try {
      setLoading(true);

      //posts의 외래키를 users
      const {data: postsData, error: postsError} = await supabase
        .from('posts')
        .select(
          `
        id,
        title,
        created_at,
        pattern_url,
        content,
       users!posts_user_id_fkey!inner(
          username,
          profile_image
        ),
        post_images (
          id,
          image_url,
          display_order
        )
      `,
        )
        .order('created_at', {ascending: false});

      if (postsError) {
        console.error('❌ posts 조회 실패:', postsError);
        throw postsError;
      }

      const allPosts: Post[] = postsData
        ? (postsData as any[]).map((post: any) => ({
            id: post.id,
            title: post.title,
            createdAt: post.created_at,
            patternUrl: post.pattern_url,
            username: post.users.username,
            profile_image: post.users.profile_image,
            images: (post.post_images || []).sort(
              (a: any, b: any) => a.display_order - b.display_order,
            ),
            content: post.content,
          }))
        : [];

      setPosts(allPosts);
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, []),
  );

  return (
    <S.Container>
      <S.ScrollView contentContainerStyle={{}}>
        {/* 메인 컨텐츠 */}
        <S.ContentSection>
          {loading ? (
            <S.ContentText>로딩 중...</S.ContentText>
          ) : posts.length === 0 ? (
            <S.ContentText>게시물이 없습니다.</S.ContentText>
          ) : (
            posts.map(post => (
              <View key={post.id} style={{marginBottom: 20}}>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 4,
                    alignItems: 'flex-end',
                    marginBottom: 8,
                  }}>
                  <Image
                    source={{uri: post.profile_image}}
                    style={{width: 48, height: 48, borderRadius: '50%'}}
                    resizeMode="cover"
                  />
                  <Text style={{fontWeight: 'bold'}}>{post.username}</Text>
                </View>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}>
                  {post.images.map((iamge, index) => (
                    <View key={index} style={{width: SCREEN_WIDTH * 0.9}}>
                      <Image
                        source={{uri: iamge.image_url}}
                        resizeMode="cover"
                        style={{width: '100%', height: 200}}
                      />
                      <S.ImageCounter>
                        {index + 1} / {post.images.length}
                      </S.ImageCounter>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  key={post.id}
                  onPress={() =>
                    navigation.navigate(HOME_ROUTES.POST_DETAIL, {
                      postId: post.id,
                    })
                  }
                  style={{marginBottom: 20}}>
                  <View>
                    <Text style={{fontWeight: '700', fontSize: 16}}>
                      {post.title}
                    </Text>

                    <Text>{post.content}</Text>
                    <Text>{new Date(post.createdAt).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
        </S.ContentSection>
      </S.ScrollView>
    </S.Container>
  );
};

export default Home;
