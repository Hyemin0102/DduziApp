import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  ActivityIndicator,
  AppState,
  DeviceEventEmitter,
  FlatList,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {RefreshControl} from 'react-native-gesture-handler';
import * as S from './Home.style';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import NativeAdCard from '@/components/common/NativeAdCard';
import PostCardSkeleton from '@/components/skeleton/PostCardSkeleton';
import {Post} from '@/@types/database';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import {HOME_ROUTES} from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import * as HS from '../Navigator/stacks/HomeStack.style';
import {trackEvent} from '@/lib/mixpanel';

const PAGE_SIZE = 10;

// 게시물 5~8개마다 광고 하나씩 — 매번 같은 순서로 반복해서, 게시물이 더 로드돼도
// 이미 배치된 광고 위치가 뒤늦게 바뀌지 않도록 함(결정론적 패턴)
const AD_GAP_SEQUENCE = [5, 7, 6, 8, 5, 8, 6, 7];

type FeedItem =
  | {type: 'post'; key: string; post: Post}
  | {type: 'ad'; key: string};

const buildFeedItems = (posts: Post[]): FeedItem[] => {
  const items: FeedItem[] = [];
  let nextAdAt = AD_GAP_SEQUENCE[0];
  let adSeq = 0;

  posts.forEach((post, index) => {
    items.push({type: 'post', key: post.id.toString(), post});
    if (index + 1 === nextAdAt) {
      items.push({type: 'ad', key: `ad-${adSeq}`});
      adSeq += 1;
      nextAdAt += AD_GAP_SEQUENCE[adSeq % AD_GAP_SEQUENCE.length];
    }
  });

  return items;
};

const Home = () => {
  const {navigation} = useCommonNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const pageRef = useRef(0);
  const blockedIdsRef = useRef<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const maxViewedIndexRef = useRef(0);

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

  // 알림 뱃지 — 안 읽은 알림 개수를 다시 조회
  // (알림센터에서 읽음 처리하고 돌아올 때, 백그라운드에서 포그라운드로
  // 돌아올 때, 포그라운드로 새 알림을 받을 때 모두 이걸 호출해서 갱신함)
  const refreshUnreadCount = useCallback(async () => {
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return;
    const {count} = await supabase
      .from('notifications')
      .select('id', {count: 'exact', head: true})
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadNotificationCount(count ?? 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('inAppNotification', () => {
      refreshUnreadCount();
    });
    return () => sub.remove();
  }, [refreshUnreadCount]);

  // 홈 피드 스크롤 깊이 트래킹 — 화면에 보인 게시물 중 가장 마지막 인덱스를
  // 계속 갱신해두고, 화면을 벗어날 때 한 번만 요약 이벤트로 남김
  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: {index: number | null}[]}) => {
      const indices = viewableItems
        .map(v => v.index)
        .filter((i): i is number => i !== null);
      if (indices.length === 0) return;
      maxViewedIndexRef.current = Math.max(
        maxViewedIndexRef.current,
        ...indices,
      );
    },
  ).current;
  const viewabilityConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  // 지금까지 기록된 스크롤 깊이를 이벤트로 보내고 카운터 리셋 — 화면 이탈
  // (다른 화면으로 이동)과 앱 백그라운드 전환 양쪽에서 공용으로 씀
  const flushScrollDepth = useCallback(() => {
    if (maxViewedIndexRef.current >= 0) {
      trackEvent('home_feed_scroll_depth', {
        posts_viewed: maxViewedIndexRef.current + 1,
      });
    }
    maxViewedIndexRef.current = -1;
  }, []);

  useFocusEffect(
    useCallback(() => {
      maxViewedIndexRef.current = -1;
      return () => {
        flushScrollDepth();
      };
    }, [flushScrollDepth]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'background') {
        flushScrollDepth();
      } else if (nextState === 'active') {
        maxViewedIndexRef.current = -1;
        refreshUnreadCount();
      }
    });
    return () => subscription.remove();
  }, [flushScrollDepth, refreshUnreadCount]);

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

  const feedItems = useMemo(() => buildFeedItems(posts), [posts]);

  const renderItem = ({item}: {item: FeedItem}) =>
    item.type === 'ad' ? <NativeAdCard /> : <PostCard post={item.post} />;

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{paddingVertical: 20}}>
        <ActivityIndicator size="small" color="#191919" />
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: '#fff'}}>
      <HS.HeaderContainer>
        <HS.LogoRow>
          <HS.Logo
            source={require('@/assets/images/bootsplash_logo.webp')}
            resizeMode="contain"
          />
        </HS.LogoRow>
        <HS.RightActions>
          <HS.SearchButton
            onPress={() => navigation.navigate(HOME_ROUTES.SEARCH)}>
            <HS.SearchBubble>
              <HS.SearchBubbleText>다들 뭐 뜨지?</HS.SearchBubbleText>
              <HS.SearchBubbleTail />
            </HS.SearchBubble>
            <Icon name="search" size={20} color="#333" />
          </HS.SearchButton>
          <HS.NotificationButton
            onPress={() => navigation.navigate(HOME_ROUTES.NOTIFICATIONS)}>
            <Icon name="bell" size={20} color="#333" />
            {unreadNotificationCount > 0 && <HS.NotificationBadge />}
          </HS.NotificationButton>
        </HS.RightActions>
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
            data={feedItems}
            keyExtractor={item => item.key}
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
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
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
