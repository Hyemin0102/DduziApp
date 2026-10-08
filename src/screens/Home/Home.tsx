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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {HOME_ROUTES} from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import * as HS from '../Navigator/stacks/HomeStack.style';
import {trackEvent} from '@/lib/mixpanel';
import PostCommentsSheet from '@/components/common/PostCommentsSheet';
import PostLikersSheet from '@/components/common/PostLikersSheet';
import SupportPromptModal from '@/components/common/SupportPromptModal';
import {getSupportModalStage, recordSupportModalShown} from '@/lib/supportModal';

interface OpenComments {
  postId: string;
  postOwnerId: string;
  postContent: string | null;
  projectId: string;
  projectTitle: string;
}

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
  const [openComments, setOpenComments] = useState<OpenComments | null>(null);
  const [likersPostId, setLikersPostId] = useState<string | null>(null);
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const [supportPromptStage, setSupportPromptStage] = useState<1 | 2 | 3>(1);
  const supportModalCheckedRef = useRef(false);

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
          profile_image,
          supporter_level,
          show_supporter_badge
        ),
        projects!inner (
          id,
          title,
          visibility,
          is_completed,
          status,
          likes_enabled,
          comments_enabled
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

    const posts: Post[] = data
      ? (data as any[]).map((post: any) => ({
          ...post,
          post_images: (post.post_images || []).sort(
            (a: any, b: any) => a.display_order - b.display_order,
          ),
        }))
      : [];

    return attachLikesAndComments(posts);
  };

  // 페이지 단위로 좋아요/댓글 카운트+좋아요 여부를 배치 조회해서 머지(게시물당 쿼리
  // 날리면 N+1이라 post_id in (...)으로 한 번씩만 조회)
  const attachLikesAndComments = async (posts: Post[]): Promise<Post[]> => {
    if (posts.length === 0) return posts;
    const postIds = posts.map(p => p.id);
    const {data: {user}} = await supabase.auth.getUser();

    const [{data: likesData}, {data: commentsData}] = await Promise.all([
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
    ]);

    const likesCountMap: Record<string, number> = {};
    const likedPostIds = new Set<string>();
    (likesData || []).forEach((l: any) => {
      likesCountMap[l.post_id] = (likesCountMap[l.post_id] || 0) + 1;
      if (user && l.user_id === user.id) likedPostIds.add(l.post_id);
    });

    const commentsCountMap: Record<string, number> = {};
    (commentsData || []).forEach((c: any) => {
      commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1;
    });

    return posts.map(p => ({
      ...p,
      likes_count: likesCountMap[p.id] || 0,
      is_liked: likedPostIds.has(p.id),
      comments_count: commentsCountMap[p.id] || 0,
    }));
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
    const foregroundSub = DeviceEventEmitter.addListener(
      'inAppNotification',
      () => refreshUnreadCount(),
    );
    // 푸쉬 탭으로 바로 딥링크됐을 때 navigationRef.ts에서 읽음 처리 후 쏘는 이벤트
    const readSub = DeviceEventEmitter.addListener('notificationsUpdated', () =>
      refreshUnreadCount(),
    );
    return () => {
      foregroundSub.remove();
      readSub.remove();
    };
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
    if (supportModalCheckedRef.current) return;
    supportModalCheckedRef.current = true;
    (async () => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return;
      const stage = await getSupportModalStage(user.id);
      if (!stage) return;
      await recordSupportModalShown(user.id, stage);
      setSupportPromptStage(stage);
      setShowSupportPrompt(true);
    })();
  }, []);

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

  const handleLikeToggled = (postId: string, liked: boolean) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {...p, is_liked: liked, likes_count: Math.max(0, (p.likes_count ?? 0) + (liked ? 1 : -1))}
          : p,
      ),
    );
  };

  const handleOpenLikers = (post: Post) => {
    setLikersPostId(post.id);
  };

  const handleOpenComments = (post: Post) => {
    setOpenComments({
      postId: post.id,
      postOwnerId: post.user_id,
      postContent: post.content ?? null,
      projectId: post.projects.id,
      projectTitle: post.projects.title,
    });
  };

  const renderItem = ({item}: {item: FeedItem}) =>
    item.type === 'ad' ? (
      <NativeAdCard />
    ) : (
      <PostCard
        post={item.post}
        onLikeToggled={handleLikeToggled}
        onOpenComments={handleOpenComments}
        onOpenLikers={handleOpenLikers}
      />
    );

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
            <Icon name="search" size={20} color="#000" />
          </HS.SearchButton>
          <HS.NotificationButton
            onPress={() => navigation.navigate(HOME_ROUTES.NOTIFICATIONS)}>
            <Ionicons name="notifications-outline" size={22} color="#000" />
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

      {/* 카드마다 바텀시트를 두면 FlatList 가상화(removeClippedSubviews)로
      스크롤 중 날아갈 수 있어서 화면 레벨에 하나만 두고 postId만 바꿔끼움 */}
      <PostLikersSheet
        visible={!!likersPostId}
        onClose={() => setLikersPostId(null)}
        postId={likersPostId ?? ''}
      />

      <SupportPromptModal
        visible={showSupportPrompt}
        onClose={() => setShowSupportPrompt(false)}
        stage={supportPromptStage}
      />

      <PostCommentsSheet
        visible={!!openComments}
        onClose={() => setOpenComments(null)}
        postId={openComments?.postId ?? ''}
        postOwnerId={openComments?.postOwnerId ?? ''}
        postContent={openComments?.postContent ?? null}
        projectId={openComments?.projectId ?? ''}
        projectTitle={openComments?.projectTitle ?? ''}
        onCommentsCountChange={count => {
          if (!openComments) return;
          const {postId} = openComments;
          setPosts(prev =>
            prev.map(p => (p.id === postId ? {...p, comments_count: count} : p)),
          );
        }}
      />
    </SafeAreaView>
  );
};

export default Home;
