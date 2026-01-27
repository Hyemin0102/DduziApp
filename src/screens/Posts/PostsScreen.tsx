// screens/Posts/PostsScreen.tsx
import React, {useState, useCallback, useEffect} from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import * as S from './PostsScreen.styles';
import {Post, PostItem} from '@/@types/database';
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

export default function PostsScreen({route}: PostsScreenProps) {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('inProgress');
  const [viewModes, setViewModes] = useState<Record<TabType, ViewMode>>({
    inProgress: 'list',
    completed: 'list',
  });

  //route로 넘어온 userId 우선
  const targetUserId = route.params?.userId;
  //route 유저가 없거나 현재 로그인한 auth user와 route 정보가 일치하면 내 페이지
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
    setViewModes(prev => ({
      ...prev,
      [activeTab]: mode,
    }));

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

  // 현재 로그인한 사용자 확인
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  //포스트 정보
  const fetchPosts = async () => {
    try {
      if (!currentUserId) {
        console.log('❌ 로그인 필요');
        setLoading(false);
        return;
      }

      const displayUserId = targetUserId || currentUserId;

      let query = supabase
        .from('posts')
        .select(
          `
        id,
        title,
        created_at,
        updated_at,
        is_completed,
        visibility,
        post_images (
          id,
          image_url,
          display_order
        )
      `,
        )
        .eq('user_id', displayUserId);

      if (!isMyPage) {
        query = query.eq('is_completed', true).eq('visibility', 'public');
      }

      query = query.order('created_at', {ascending: false});

      const {data: postsData, error: postsError} = await query;

      if (postsError) {
        console.error('❌ posts 조회 실패:', postsError);
        throw postsError;
      }

      console.log('데이터 불러옴', postsData);

      setPosts(postsData);
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

  //포스트 작성 이동
  const handleCreatePost = () => {
    navigation.navigate(POST_ROUTES.CREATE_POST);
  };

  //탭에 따라 필터링 (내 페이지가 아니면 필터링 없이 전체 반환)
  const filteredPosts = isMyPage
    ? posts.filter(post => {
        if (activeTab === 'inProgress') {
          return !post.is_completed;
        } else {
          return post.is_completed;
        }
      })
    : posts;

  const inProgressCount = posts.filter(p => !p.is_completed).length;
  const completedCount = posts.filter(p => p.is_completed).length;

  const renderListItem = ({item}: {item: PostItem}) => {
    return (
      <S.PostCard>
        {/* 이미지 가로 스크롤 */}
        {item.post_images.length > 0 ? (
          <S.ImageContainer>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{width: '100%', height: 200}}>
              {item.post_images.map((image, index) => (
                <S.PostImage key={image.id}>
                  <Image
                    source={{uri: image.image_url}}
                    style={{width: 200, height: 200}}
                    resizeMode="cover"
                  />
                </S.PostImage>
              ))}
            </ScrollView>
            {/* 이미지 개수 표시 */}
            {item.post_images.length > 1 && (
              <S.ImageCountBadge>
                <S.ImageCountText>{item.post_images.length}장</S.ImageCountText>
              </S.ImageCountBadge>
            )}
          </S.ImageContainer>
        ) : (
          // 이미지 없을 때
          <S.NoImageContainer>
            <S.NoImageText>📝</S.NoImageText>
          </S.NoImageContainer>
        )}

        {/* 제목과 날짜 */}
        <S.PostInfo
          onPress={() =>
            navigation.navigate(POST_ROUTES.POST_DETAIL, {
              postId: item.id,
            })
          }
          activeOpacity={0.8}>
          <S.PostTitle numberOfLines={2}>{item.title}</S.PostTitle>
          <S.PostDate>
            {new Date(item.created_at).toLocaleDateString('ko-KR')}
          </S.PostDate>
        </S.PostInfo>
      </S.PostCard>
    );
  };

  const renderGridItem = ({item}: {item: PostItem}) => {
    const firstImage = item.post_images[0]?.image_url;

    return (
      <S.GridItem
        style={{width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}}
        onPress={() =>
          navigation.navigate(POST_ROUTES.POST_DETAIL, {
            postId: item.id,
          })
        }
        activeOpacity={0.8}>
        {firstImage ? (
          <>
            <S.GridImage source={{uri: firstImage}} resizeMode="cover" />
            {/* 여러 이미지가 있으면 아이콘 표시 */}
            {item.post_images.length > 1 && (
              <S.MultipleImageIcon>
                <Icon name="layers" size={16} color="#fff" />
              </S.MultipleImageIcon>
            )}
          </>
        ) : (
          <S.GridNoImage>
            <S.GridNoImageText>📝</S.GridNoImageText>
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
          <S.LoadingText>게시물 불러오는 중...</S.LoadingText>
        </S.LoadingContainer>
      </S.Container>
    );
  }

  return (
    <S.Container>
      {/* 사용자 프로필 카드 */}

      <S.ProfileSection>
        <UserProfileCard
          userId={isMyPage ? currentUserId : targetUserId}
          isMyPage={isMyPage}
        />
      </S.ProfileSection>

      {/* 🔥 탭 네비게이션 */}

      {isMyPage && (
        <S.TabContainer>
          <S.Tab
            active={activeTab === 'inProgress'}
            onPress={() => setActiveTab('inProgress')}>
            <S.TabText active={activeTab === 'inProgress'}>
              진행중 ({inProgressCount})
            </S.TabText>
            {activeTab === 'inProgress' && <S.TabIndicator />}
          </S.Tab>

          <S.Tab
            active={activeTab === 'completed'}
            onPress={() => setActiveTab('completed')}>
            <S.TabText active={activeTab === 'completed'}>
              완료 ({completedCount})
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
                  ? '진행 중인 프로젝트가 없어요'
                  : '완료된 프로젝트가 없어요'
                : '작성한 프로젝트가 없어요'}
            </S.EmptyText>
            <S.EmptySubText>
              {isMyPage
                ? activeTab === 'inProgress'
                  ? '첫 프로젝트를 시작해보세요! 🧶'
                  : '프로젝트를 완료해보세요!'
                : ''}
            </S.EmptySubText>
          </S.EmptyContainer>
        }
      />

      {/* 플로팅 작성 버튼 */}
      {/* <S.FloatingButton onPress={handleCreatePost}>
        <S.FloatingButtonText>+</S.FloatingButtonText>
      </S.FloatingButton> */}
    </S.Container>
  );
}
