import React, {useState, useEffect, useRef, useCallback} from 'react';
import {DeviceEventEmitter, FlatList} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {RefreshControl} from 'react-native-gesture-handler';
import * as S from './Home.style';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import PostCardSkeleton from '@/components/skeleton/PostCardSkeleton';
import {Post} from '@/@types/database';

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchPosts = async () => {
    try {
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
          ),
          projects!inner (
            id,
            title,
            visibility,
            is_completed
          )
        `,
        )
        .eq('projects.visibility', 'public')
        .order('created_at', {ascending: false});

      if (error) throw error;

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
      setLoading(false); // 데이터만 오면 바로 스켈레톤 해제
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, []),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('homeTabRepress', () => {
      flatListRef.current?.scrollToOffset({offset: 0, animated: true});
      onRefresh();
    });
    return () => sub.remove();
  }, []);

  const renderItem = ({item}: {item: Post}) => <PostCard post={item} />;

  

  return (
    <S.Container>
      {loading ? (
        <S.Fill>
          <FlatList
            data={new Array(5).fill('')}
            keyExtractor={(_, idx) => String(idx)}
            renderItem={() => <PostCardSkeleton count={1} />}
            contentContainerStyle={{paddingVertical: 16}}
            scrollEnabled={false}
          />
        </S.Fill>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#191919"
            />
          }
          ListEmptyComponent={
            <S.EmptyContainer>
              <S.EmptyText>게시물이 없습니다</S.EmptyText>
            </S.EmptyContainer>
          }
        />
      )}
    </S.Container>
  );
};

export default Home;
