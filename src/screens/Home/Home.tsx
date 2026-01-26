import React, {useState, useEffect} from 'react';
import {ActivityIndicator, FlatList} from 'react-native';
import {RefreshControl} from 'react-native-gesture-handler';
import * as S from './Home.style';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import {Post} from '@/@types/database';

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const {data, error} = await supabase
        .from('posts')
        .select(
          `
          *,
          post_images (*),
          users (
            id,
            nickname,
            profile_image
          )
        `,
        )
        .eq('is_completed', true)
        .eq('visibility', 'public') //공개 게시물만
        .order('created_at', {ascending: false});

      if (error) {
        console.error('posts 조회 실패:', error);
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
      console.error('게시물 로드 실패:', error);
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

  const renderItem = ({item}: {item: Post}) => <PostCard post={item} />;

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <S.LoadingContainer>
          <ActivityIndicator size="large" color="#007AFF" />
        </S.LoadingContainer>
      );
    }

    if (posts.length === 0) {
      return (
        <S.EmptyContainer>
          <S.EmptyText>게시물이 없습니다</S.EmptyText>
        </S.EmptyContainer>
      );
    }

    return null;
  };

  return (
    <S.Container>
      <FlatList
        data={loading ? [] : posts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      />
    </S.Container>
  );
};

export default Home;
