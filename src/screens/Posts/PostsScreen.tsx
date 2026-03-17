// screens/Posts/PostsScreen.tsx
import React, {useState, useCallback, useEffect, useRef} from 'react';
import {FlatList, RefreshControl, Dimensions, Image, View, StyleSheet} from 'react-native';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import * as S from './PostsScreen.styles';
import {supabase} from '@/lib/supabase';
import UserProfileCard from '@/components/common/UserProfileCard';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import Icon from 'react-native-vector-icons/Feather';
import {PostsStackParamList} from '@/@types/navigation';
import PostsGridSkeleton from '@/components/skeleton/PostsGridSkeletom';

type TabType = 'inProgress' | 'completed';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

type PostsScreenRouteProp = RouteProp<
  PostsStackParamList,
  typeof POST_ROUTES.POSTS_MAIN
>;

interface PostsScreenProps {
  route: PostsScreenRouteProp;
}

interface PostListItem {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  project_id: string;
  post_images: {id: string; image_url: string; display_order: number}[];
  projects: {title: string; is_completed: boolean; visibility: string} | null;
}

const getFirstImageUrl = (post: PostListItem) =>
  [...post.post_images].sort((a, b) => a.display_order - b.display_order)[0]
    ?.image_url;

const GridCell = ({
  item,
  onPress,
  onFirstImageLoad,
}: {
  item: PostListItem;
  onPress: () => void;
  onFirstImageLoad?: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const firstImage = getFirstImageUrl(item);

  const handleLoadEnd = () => {
    setImageLoaded(true);
    onFirstImageLoad?.();
  };

  return (
    <S.GridItem
      style={{width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}}
      onPress={onPress}
      activeOpacity={0.8}>
      {firstImage ? (
        <>
          <S.GridImage
            source={{uri: firstImage}}
            resizeMode="cover"
            onLoadEnd={handleLoadEnd}
          />
          {imageLoaded && item.post_images.length > 1 && (
            <S.MultipleImageIcon>
              <Icon name="layers" size={16} color="#fff" />
            </S.MultipleImageIcon>
          )}
          {imageLoaded && item.projects?.visibility === 'private' && (
            <S.PrivateLockIcon>
              <Icon name="lock" size={13} color="#fff" />
            </S.PrivateLockIcon>
          )}
        </>
      ) : (
        <S.GridNoImage>
          <S.GridNoImageText>🧶</S.GridNoImageText>
        </S.GridNoImage>
      )}
    </S.GridItem>
  );
};

export default function PostsScreen({route}: PostsScreenProps) {
  const {navigation} = useCommonNavigation<any>();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set());
  const [imagesRendered, setImagesRendered] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('inProgress');

  const imageRenderedRef = useRef(false);

  const targetUserId = route.params?.userId;
  const isMyPage = !targetUserId || targetUserId === currentUserId;

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const resetImageRendered = () => {
    imageRenderedRef.current = false;
    setImagesRendered(false);
  };

  const handleFirstImageLoad = useCallback(() => {
    if (!imageRenderedRef.current) {
      imageRenderedRef.current = true;
      setImagesRendered(true);
    }
  }, []);

  const prefetchTab = async (tabPosts: PostListItem[], tab: TabType) => {
    const urls = tabPosts.map(getFirstImageUrl).filter(Boolean) as string[];
    await Promise.all(urls.map(url => Image.prefetch(url)));
    setLoadedTabs(prev => new Set([...prev, tab]));
  };

  const fetchPosts = async () => {
    try {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      const displayUserId = targetUserId || currentUserId;

      let query = supabase
        .from('posts')
        .select(
          `id, user_id, content, created_at, project_id,
           post_images ( id, image_url, display_order ),
           projects ( title, is_completed, visibility )`,
        )
        .eq('user_id', displayUserId);

      if (!isMyPage) {
        query = query.eq('projects.visibility', 'public');
      }

      query = query.order('created_at', {ascending: false});

      const {data, error} = await query;
      if (error) throw error;

      const fetchedPosts = (data as unknown as PostListItem[]) || [];
      setPosts(fetchedPosts);

      const inProgressPosts = fetchedPosts.filter(
        p => !p.projects?.is_completed,
      );
      const completedPosts = fetchedPosts.filter(p => p.projects?.is_completed);

      await prefetchTab(inProgressPosts, 'inProgress');
      prefetchTab(completedPosts, 'completed');

      // 이미지가 없는 경우 skeleton을 바로 해제
      const hasImages = inProgressPosts.some(getFirstImageUrl);
      if (!hasImages) {
        setImagesRendered(true);
        imageRenderedRef.current = true;
      }
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        setLoading(true);
        setLoadedTabs(new Set());
        resetImageRendered();
        fetchPosts();
      }
    }, [currentUserId, targetUserId]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setLoadedTabs(new Set());
    resetImageRendered();
    fetchPosts();
  };

  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      resetImageRendered();
      // 전환할 탭에 이미지가 없으면 바로 해제
      const tabPosts = posts.filter(p =>
        tab === 'inProgress' ? !p.projects?.is_completed : p.projects?.is_completed,
      );
      if (!tabPosts.some(getFirstImageUrl)) {
        setImagesRendered(true);
        imageRenderedRef.current = true;
      }
      setActiveTab(tab);
    }
  };

  const handleCreatePost = () => {
    navigation.navigate(POST_ROUTES.CREATE_POST);
  };

  const getIsCompleted = (post: PostListItem) =>
    post.projects?.is_completed ?? false;

  const filteredPosts = isMyPage
    ? posts.filter(post => {
        const isCompleted = getIsCompleted(post);
        return activeTab === 'inProgress' ? !isCompleted : isCompleted;
      })
    : posts;

  const inProgressCount = posts.filter(p => !getIsCompleted(p)).length;
  const completedCount = posts.filter(p => getIsCompleted(p)).length;

  const isTabLoading = loading || !loadedTabs.has(activeTab);
  const showSkeletonOverlay = !isTabLoading && !imagesRendered;
  const skeletonCount =
    activeTab === 'inProgress' ? inProgressCount : completedCount;

  const renderGridItem = ({item}: {item: PostListItem}) => (
    <GridCell
      item={item}
      onPress={() =>
        navigation.navigate(POST_ROUTES.POST_DETAIL, {postId: item.id})
      }
      onFirstImageLoad={handleFirstImageLoad}
    />
  );

  return (
    <S.Container>
      <S.ProfileSection>
        <UserProfileCard
          userId={isMyPage ? currentUserId : targetUserId}
          isMyPage={isMyPage}
        />
      </S.ProfileSection>

      {isMyPage && (
        <S.TabContainer>
          <S.Tab
            active={activeTab === 'inProgress'}
            onPress={() => handleTabChange('inProgress')}>
            <S.TabText active={activeTab === 'inProgress'}>
              뜨개 중 ({inProgressCount})
            </S.TabText>
            {activeTab === 'inProgress' && <S.TabIndicator />}
          </S.Tab>
          <S.Tab
            active={activeTab === 'completed'}
            onPress={() => handleTabChange('completed')}>
            <S.TabText active={activeTab === 'completed'}>
              뜨개 완료 ({completedCount})
            </S.TabText>
            {activeTab === 'completed' && <S.TabIndicator />}
          </S.Tab>
        </S.TabContainer>
      )}

      <View style={styles.gridArea}>
        {/* FlatList는 항상 마운트, skeleton이 위에서 가림 */}
        {!isTabLoading && (
          <FlatList
            data={filteredPosts}
            renderItem={renderGridItem}
            keyExtractor={item => item.id}
            key={activeTab}
            numColumns={3}
            contentContainerStyle={{}}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <S.EmptyContainer>
                <S.EmptyIcon>📝</S.EmptyIcon>
                <S.EmptyText>
                  {isMyPage
                    ? activeTab === 'inProgress'
                      ? '진행 중인 뜨개가 없어요'
                      : '완료된 뜨개가 없어요'
                    : '작성한 게시물이 없어요'}
                </S.EmptyText>
                <S.EmptySubText>
                  {isMyPage
                    ? activeTab === 'inProgress'
                      ? '첫 프로젝트를 시작해보세요! 🧶'
                      : '뜨개를 완료해보세요!'
                    : ''}
                </S.EmptySubText>
                {isMyPage && activeTab === 'inProgress' && (
                  <S.EmptyAddButton onPress={handleCreatePost}>
                    <S.EmptyAddButtonText>뜨개 추가하기</S.EmptyAddButtonText>
                  </S.EmptyAddButton>
                )}
              </S.EmptyContainer>
            }
          />
        )}

        {/* prefetch 중 또는 이미지 렌더링 전 skeleton overlay */}
        {(isTabLoading || showSkeletonOverlay) && (
          <View style={isTabLoading ? styles.fill : StyleSheet.absoluteFillObject}>
            <PostsGridSkeleton count={skeletonCount} />
          </View>
        )}
      </View>
    </S.Container>
  );
}

const styles = StyleSheet.create({
  gridArea: {
    flex: 1,
    position: 'relative',
  },
  fill: {
    flex: 1,
  },
});
