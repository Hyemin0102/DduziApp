// screens/Posts/PostsScreen.tsx
import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  FlatList,
  RefreshControl,
  Dimensions,
  Animated,
  View,
} from 'react-native';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import * as S from './PostsScreen.styles';
import {supabase} from '@/lib/supabase';
import UserProfileCard from '@/components/common/UserProfileCard';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import Icon from 'react-native-vector-icons/Feather';
import {PostsStackParamList} from '@/@types/navigation';

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

const SKELETON_DATA = new Array(0)
  .fill(null)
  .map((_, i) => ({id: `skeleton-${i}`}));

const getFirstImageUrl = (post: PostListItem) =>
  [...post.post_images].sort((a, b) => a.display_order - b.display_order)[0]
    ?.image_url;

// ── 실제 그리드 셀 (이미지 로드 전엔 ShimmerCell 오버레이)
const GridCell = ({
  item,
  onPress,
}: {
  item: PostListItem;
  onPress: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const shimmerOpacity = useRef(new Animated.Value(0.4)).current;
  const firstImage = getFirstImageUrl(item);

  useEffect(() => {
    if (imageLoaded) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [imageLoaded]);

  return (
    <S.GridItem
      style={{width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}}
      onPress={onPress}
      activeOpacity={0.8}>
      {firstImage ? (
        <>
          {!imageLoaded && (
            <Animated.View
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: '#e8e8e8',
                opacity: shimmerOpacity,
              }}
            />
          )}
          <S.GridImage
            source={{uri: firstImage}}
            resizeMode="cover"
            onLoadEnd={() => setImageLoaded(true)}
            style={{opacity: imageLoaded ? 1 : 0}}
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
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('inProgress');

  console.log('posts', posts);

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

  const fetchPosts = async () => {
    try {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      const displayUserId = targetUserId || currentUserId;

      const projectsJoin = isMyPage
        ? 'projects ( title, is_completed, visibility )'
        : 'projects!inner ( title, is_completed, visibility )';

      let query = supabase
        .from('posts')
        .select(
          `id, user_id, content, created_at, project_id,
           post_images ( id, image_url, display_order ),
           ${projectsJoin}`,
        )
        .eq('user_id', displayUserId);

      if (!isMyPage) {
        query = query.eq('projects.visibility', 'public');
      }

      query = query.order('created_at', {ascending: false});

      const {data, error} = await query;
      if (error) throw error;

      setPosts((data as unknown as PostListItem[]) || []);
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
        fetchPosts();
      }
    }, [currentUserId, targetUserId]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const getIsCompleted = (post: PostListItem) =>
    post.projects?.is_completed ?? false;

  const visiblePosts = isMyPage
    ? posts
    : posts.filter(p => p.projects?.visibility === 'public');

  const filteredPosts = visiblePosts.filter(post =>
    activeTab === 'inProgress' ? !getIsCompleted(post) : getIsCompleted(post),
  );

  const inProgressCount = visiblePosts.filter(p => !getIsCompleted(p)).length;
  const completedCount = visiblePosts.filter(p => getIsCompleted(p)).length;

  const handleAddPost = () => {
    navigation.navigate(POST_ROUTES.CREATE_POST_FOR_PROJECT);
  };

  return (
    <S.Container>
      <S.ProfileSection>
        <UserProfileCard
          userId={isMyPage ? currentUserId : targetUserId}
          isMyPage={isMyPage}
          onAddPost={handleAddPost}
        />
      </S.ProfileSection>

      <S.TabContainer>
        <S.Tab
          active={activeTab === 'inProgress'}
          onPress={() => setActiveTab('inProgress')}>
          <S.TabText active={activeTab === 'inProgress'}>
            뜨개 중 ({inProgressCount})
          </S.TabText>
          {activeTab === 'inProgress' && <S.TabIndicator />}
        </S.Tab>
        <S.Tab
          active={activeTab === 'completed'}
          onPress={() => setActiveTab('completed')}>
          <S.TabText active={activeTab === 'completed'}>
            뜨개 완료 ({completedCount})
          </S.TabText>
          {activeTab === 'completed' && <S.TabIndicator />}
        </S.Tab>
      </S.TabContainer>

      <FlatList
        data={filteredPosts}
        renderItem={({item, index}) => (
          <GridCell
            item={item as PostListItem}
            onPress={() =>
              navigation.navigate(POST_ROUTES.POST_DETAIL, {
                postId: (item as PostListItem).id,
              })
            }
          />
        )}
        keyExtractor={item => item.id}
        key={activeTab}
        numColumns={3}
        contentContainerStyle={{}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
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
                <S.EmptyAddButton
                  onPress={() => navigation.navigate(POST_ROUTES.CREATE_POST)}>
                  <S.EmptyAddButtonText>뜨개 추가하기</S.EmptyAddButtonText>
                </S.EmptyAddButton>
              )}
            </S.EmptyContainer>
          ) : null
        }
      />
    </S.Container>
  );
}
