import React, {useState, useEffect, useRef, useCallback} from 'react';
import {ActivityIndicator, DeviceEventEmitter, FlatList, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {RefreshControl} from 'react-native-gesture-handler';
import * as S from './Home.style';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import PostCardSkeleton from '@/components/skeleton/PostCardSkeleton';
import {Post} from '@/@types/database';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import {HOME_ROUTES} from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import * as HS from '../Navigator/stacks/HomeStack.style';

const PAGE_SIZE = 10;

const Home = () => {
  const {navigation} = useCommonNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const blockedIdsRef = useRef<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const fetchBlockedIds = async (): Promise<string[]> => {
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return [];
    const {data: blocks} = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    return blocks ? blocks.map(b => b.blocked_id) : [];
  };

  const fetchPage = async (page: number, ids: string[]): Promise<Post[]> => {
    let query = supabase
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
      .order('created_at', {ascending: false})
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (ids.length > 0) {
      query = query.not('user_id', 'in', `(${ids.join(',')})`);
    }

    const {data, error} = await query;
    if (error) throw error;

    return data
      ? (data as any[]).map((post: any) => ({
          ...post,
          post_images: (post.post_images || []).sort(
            (a: any, b: any) => a.display_order - b.display_order,
          ),
        }))
      : [];
  };

  const fetchPosts = async () => {
    try {
      const ids = await fetchBlockedIds();
      blockedIdsRef.current = ids;
      const firstPage = await fetchPage(0, ids);
      pageRef.current = 0;
      setHasMore(firstPage.length === PAGE_SIZE);
      setPosts(firstPage);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const newPosts = await fetchPage(nextPage, blockedIdsRef.current);
      if (newPosts.length < PAGE_SIZE) setHasMore(false);
      if (newPosts.length > 0) {
        pageRef.current = nextPage;
        setPosts(prev => [...prev, ...newPosts]);
      }
    } catch (error) {
      console.error('추가 게시물 로드 실패:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setRefreshing(false);
      if (posts.length === 0) {
        fetchPosts();
      }
    }, [posts.length]),
  );

  useEffect(() => {
    const homeTabSub = DeviceEventEmitter.addListener('homeTabRepress', () => {
      flatListRef.current?.scrollToOffset({offset: 0, animated: true});
      onRefresh();
    });
    const deleteSub = DeviceEventEmitter.addListener(
      'postDeleted',
      ({postId}: {postId: string}) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
      },
    );
    const blockSub = DeviceEventEmitter.addListener(
      'userBlocked',
      ({blockedId}: {blockedId: string}) => {
        blockedIdsRef.current = [...blockedIdsRef.current, blockedId];
        setPosts(prev => prev.filter(p => p.user_id !== blockedId));
      },
    );
    return () => {
      homeTabSub.remove();
      deleteSub.remove();
      blockSub.remove();
    };
  }, []);

  const renderItem = ({item}: {item: Post}) => <PostCard post={item} />;

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{paddingVertical: 20}}>
        <ActivityIndicator size="small" color="#191919" />
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <HS.HeaderContainer>
        <HS.LogoRow>
          <HS.Logo
            source={require('@/assets/images/bootsplash_logo.webp')}
            resizeMode="contain"
          />
        </HS.LogoRow>
        <HS.SearchButton
          onPress={() => navigation.navigate(HOME_ROUTES.SEARCH)}>
          <Icon name="search" size={24} color="#333" />
        </HS.SearchButton>
      </HS.HeaderContainer>
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
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            windowSize={5}
            maxToRenderPerBatch={5}
            removeClippedSubviews={true}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <S.EmptyContainer>
                <S.EmptyText>게시물이 없습니다</S.EmptyText>
              </S.EmptyContainer>
            }
          />
        )}
      </S.Container>
    </SafeAreaView>
  );
};

export default Home;
