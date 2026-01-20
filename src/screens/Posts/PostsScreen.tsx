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
import { useFocusEffect} from '@react-navigation/native';
import * as S from './PostsScreen.styles';
import {PostListItem} from '@/@types/post';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import UserProfileCard from '@/components/UserProfileCard';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';

export default function PostsScreen() {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // 현재 로그인한 사용자 확인
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const fetchPosts = async () => {
    try {
      if (!currentUser) {
        console.log('❌ 로그인 필요');
        setLoading(false);
        return;
      }

      // 내 게시물만 가져오기
      const {data: postsData, error: postsError} = await supabase
        .from('posts')
        .select(
          `
          id,
          title,
          created_at,
          post_images (
            id,
            image_url,
            display_order
          )
        `,
        )
        .eq('user_id', currentUser) // 내 게시물만
        .order('created_at', {ascending: false});

      if (postsError) {
        console.error('❌ posts 조회 실패:', postsError);
        throw postsError;
      }

      // 데이터 변환
      const myPosts: any[] = (postsData || []).map(post => ({
        ...post,
        images: (post.post_images || []).sort(
          (a, b) => a.display_order - b.display_order,
        ),
      }));

      setPosts(myPosts);
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchPosts();
      }
    }, [currentUser]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  //포스트 작성 이동
  const handleCreatePost = () => {
    navigation.navigate(POST_ROUTES.CREATE_POST);
  };

  //포스트 상세 이동
  const handlePostPress = (postId: string) => {
    navigation.navigate(POST_ROUTES.POST_DETAIL, {
      postId,
    });
  };

  const renderPost = ({item}: {item: PostListItem}) => {
    return (
      <S.PostCard
        onPress={() =>
          navigation.navigate(POST_ROUTES.POST_DETAIL, {
            postId: item.id,
          })
        }
        activeOpacity={0.8}>
        {/* 이미지 가로 스크롤 */}
        {item.images.length > 0 ? (
          <S.ImageContainer>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{width: '100%', height: 200}}>
              {item.images.map((image, index) => (
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
            {item.images.length > 1 && (
              <S.ImageCountBadge>
                <S.ImageCountText>{item.images.length}장</S.ImageCountText>
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
        <S.PostInfo>
          <S.PostTitle numberOfLines={2}>{item.title}</S.PostTitle>
          <S.PostDate>{item.created_at}</S.PostDate>
        </S.PostInfo>
      </S.PostCard>
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
      {user && (
        <S.ProfileSection>
          <UserProfileCard user={user} />
        </S.ProfileSection>
      )}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingBottom: 100, paddingTop: 20, gap: 16}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <S.EmptyContainer>
            <S.EmptyIcon>📝</S.EmptyIcon>
            <S.EmptyText>아직 작성된 프로젝트가 없어요</S.EmptyText>
            <S.EmptySubText>첫 프로젝트를 시작해보세요! 🧶</S.EmptySubText>
          </S.EmptyContainer>
        }
      />

      {/* 플로팅 작성 버튼 */}
      <S.FloatingButton onPress={handleCreatePost}>
        <S.FloatingButtonText>+</S.FloatingButtonText>
      </S.FloatingButton>
    </S.Container>
  );
}
