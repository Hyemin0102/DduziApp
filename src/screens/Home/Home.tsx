import React, {useState, useCallback, useEffect} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import * as S from './Home.style';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import { Post } from '@/@types/post';
import { RefreshControl } from 'react-native-gesture-handler';

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  
  console.log('홈', posts);
  
  const fetchPosts = async () => {
    try {
      setLoading(true);

      //posts의 외래키를 users
      const {data, error} = await supabase
        .from('posts')
        .select(
          `
          *,
          post_images (*),
          users (
            id,
            username,
            profile_image
          )
        `
        )
        .order('created_at', {ascending: false});

      if (error) {
        console.error('❌ posts 조회 실패:', error);
        throw error;
      }

      const allPosts: Post[] = data
      ? (data as any[]).map((post: any) => ({
          ...post, 
          post_images: (post.post_images || []).sort(
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <S.Container>
      <S.ScrollView 
        contentContainerStyle={{}}  
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }>
        {/* 메인 컨텐츠 */}
        <S.ContentSection>
          {loading ? (
            <S.ContentText>로딩 중...</S.ContentText>
          ) : posts.length === 0 ? (
            <S.ContentText>게시물이 없습니다.</S.ContentText>
          ) : (
            posts.map(post => <PostCard key={post.id} post={post} />)
          )}
        </S.ContentSection>
      </S.ScrollView>
    </S.Container>
  );
};

export default Home;
