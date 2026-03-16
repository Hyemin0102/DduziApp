// screens/Posts/PostsScreen.tsx
import React, {useState, useCallback, useEffect} from 'react';
import {
  FlatList,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import * as S from './PostsScreen.styles';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import UserProfileCard from '@/components/common/UserProfileCard';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PostsStackParamList} from '@/@types/navigation';

const STORAGE_KEY_IN_PROGRESS = '@view_mode_in_progress';
const STORAGE_KEY_COMPLETED = '@view_mode_completed';
type TabType = 'inProgress' | 'completed';
type ViewMode = 'list' | 'grid';

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

export default function PostsScreen({route}: PostsScreenProps) {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('inProgress');
  const [viewModes, setViewModes] = useState<Record<TabType, ViewMode>>({
    inProgress: 'list',
    completed: 'list',
  });

  const targetUserId = route.params?.userId;
  const isMyPage = !targetUserId || targetUserId === currentUserId;

  useEffect(() => {
    loadViewModes();
  }, []);

  const loadViewModes = async () => {
    try {
      const [inProgress, completed] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_IN_PROGRESS),
        AsyncStorage.getItem(STORAGE_KEY_COMPLETED),
      ]);
      setViewModes({
        inProgress: (inProgress as ViewMode) || 'list',
        completed: (completed as ViewMode) || 'list',
      });
    } catch (error) {
      console.error('보기 방식 불러오기 실패:', error);
    }
  };

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewModes(prev => ({...prev, [activeTab]: mode}));
    try {
      const storageKey =
        activeTab === 'inProgress'
          ? STORAGE_KEY_IN_PROGRESS
          : STORAGE_KEY_COMPLETED;
      await AsyncStorage.setItem(storageKey, mode);
    } catch (error) {
      console.error('보기 방식 저장 실패:', error);
    }
  };

  const currentViewMode = viewModes[activeTab];

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

      let query = supabase
        .from('posts')
        .select(
          `
          id,
          user_id,
          content,
          created_at,
          project_id,
          post_images (
            id,
            image_url,
            display_order
          ),
          projects (
            title,
            is_completed,
            visibility
          )
        `,
        )
        .eq('user_id', displayUserId);

      if (!isMyPage) {
        query = query.eq('projects.visibility', 'public');
      }

      query = query.order('created_at', {ascending: false});

      const {data, error} = await query;

      if (error) {
        console.error('❌ posts 조회 실패:', error);
        throw error;
      }

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
        fetchPosts();
      }
    }, [currentUserId, targetUserId]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleCreatePost = () => {
    navigation.navigate(POST_ROUTES.CREATE_POST);
  };

  const handleCreatePostFAB = () => {
    navigation.navigate(POST_ROUTES.CREATE_POST_FOR_PROJECT);
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

  const navigateToDetail = (postId: string) => {
    navigation.navigate(POST_ROUTES.POST_DETAIL, {postId});
  };

  const renderListItem = ({item}: {item: PostListItem}) => {
    const sortedImages = [...item.post_images].sort(
      (a, b) => a.display_order - b.display_order,
    );

    return (
      <S.PostCard>
        {sortedImages.length > 0 ? (
          <S.ImageContainer>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH - 32}
              decelerationRate="fast"
              style={{height: 200}}>
              {sortedImages.map((image, index) => (
                <S.ImageContainer
                  key={image.id}
                  style={{width: SCREEN_WIDTH - 32}}>
                  <S.PostImage
                    source={{uri: image.image_url}}
                    style={{width: '100%', height: '100%'}}
                  />
                  {sortedImages.length > 1 && (
                    <S.ImageCounter>
                      {index + 1} / {sortedImages.length}
                    </S.ImageCounter>
                  )}
                </S.ImageContainer>
              ))}
            </ScrollView>
          </S.ImageContainer>
        ) : (
          <S.NoImageContainer>
            <S.NoImageText>🧶</S.NoImageText>
          </S.NoImageContainer>
        )}

        <S.PostInfo onPress={() => navigateToDetail(item.id)} activeOpacity={0.8}>
          {item.projects?.title ? (
            <S.PostTitle numberOfLines={1}>{item.projects.title}</S.PostTitle>
          ) : null}
          {item.content ? (
            <S.PostDate numberOfLines={2}>{item.content}</S.PostDate>
          ) : null}
          <S.PostDate>
            {new Date(item.created_at).toLocaleDateString('ko-KR')}
          </S.PostDate>
        </S.PostInfo>
      </S.PostCard>
    );
  };

  const renderGridItem = ({item}: {item: PostListItem}) => {
    const firstImage = [...item.post_images]
      .sort((a, b) => a.display_order - b.display_order)[0]?.image_url;

    return (
      <S.GridItem
        style={{width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}}
        onPress={() => navigateToDetail(item.id)}
        activeOpacity={0.8}>
        {firstImage ? (
          <>
            <S.GridImage source={{uri: firstImage}} resizeMode="cover" />
            {item.post_images.length > 1 && (
              <S.MultipleImageIcon>
                <Icon name="layers" size={16} color="#fff" />
              </S.MultipleImageIcon>
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

  if (loading) {
    return (
      <S.Container>
        <S.LoadingContainer>
          <ActivityIndicator size="large" color="#0070f3" />
          <S.LoadingText>불러오는 중...</S.LoadingText>
        </S.LoadingContainer>
      </S.Container>
    );
  }

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
      )}

      <S.ViewModeToggle>
        <S.ViewModeButton
          onPress={() => handleViewModeChange('list')}
          active={currentViewMode === 'list'}>
          <Icon
            name="list"
            size={20}
            color={currentViewMode === 'list' ? '#007AFF' : '#999'}
          />
        </S.ViewModeButton>
        <S.ViewModeButton
          onPress={() => handleViewModeChange('grid')}
          active={currentViewMode === 'grid'}>
          <Icon
            name="grid"
            size={20}
            color={currentViewMode === 'grid' ? '#007AFF' : '#999'}
          />
        </S.ViewModeButton>
      </S.ViewModeToggle>

      <FlatList
        data={filteredPosts}
        renderItem={
          currentViewMode === 'list' ? renderListItem : renderGridItem
        }
        keyExtractor={item => item.id}
        key={`${activeTab}-${currentViewMode}`}
        numColumns={currentViewMode === 'grid' ? 3 : 1}
        contentContainerStyle={
          currentViewMode === 'list'
            ? {paddingHorizontal: 16, paddingVertical: 20, gap: 16}
            : {paddingVertical: 20}
        }
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
      {isMyPage && (
        <S.FloatingButton onPress={handleCreatePostFAB}>
          <S.FloatingButtonText>+</S.FloatingButtonText>
        </S.FloatingButton>
      )}
    </S.Container>
  );
}
