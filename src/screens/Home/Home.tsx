import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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
}

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

      console.log('✅ 조회된 데이터:', postsData);

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
          }))
        : [];

      setPosts(allPosts);
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
              <TouchableOpacity
                key={post.id}
                onPress={() =>
                  navigation.navigate(HOME_ROUTES.POST_DETAIL, {
                    postId: post.id,
                  })
                }
                style={{marginBottom: 20}}>
                <View key={post.id} style={{marginBottom: 20}}>
                  <Text style={{fontWeight: 'bold'}}>{post.username}</Text>
                  <Image
                    source={{uri: post.profile_image}}
                    style={{width: 48, height: 48, borderRadius: '50%'}}
                    resizeMode="cover"
                  />
                  <Text>{post.title}</Text>
                  <Text>{new Date(post.createdAt).toLocaleDateString()}</Text>
                  {post.images[0] && (
                    <Image
                      source={{uri: post.images[0].image_url}}
                      style={{width: '100%', height: 200}}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </S.ContentSection>
      </S.ScrollView>
    </S.Container>
  );
};

export default Home;
