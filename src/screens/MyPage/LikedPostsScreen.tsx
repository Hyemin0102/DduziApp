import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import * as S from './LikedPostsScreen.styles';
import {supabase} from '@/lib/supabase';
import {thumbnailUrl} from '@/lib/imageTransform';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {useAuth} from '@/contexts/AuthContext';

interface LikedPostItem {
  id: string;
  post_images: {id: string; image_url: string; display_order: number}[];
}

const getFirstImageUrl = (post: LikedPostItem) =>
  [...post.post_images].sort((a, b) => a.display_order - b.display_order)[0]
    ?.image_url;

export default function LikedPostsScreen() {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const [posts, setPosts] = useState<LikedPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLikedPosts = useCallback(async () => {
    if (!user) return;
    try {
      const {data, error} = await supabase
        .from('likes')
        .select(
          `
          created_at,
          posts (
            id,
            post_images ( id, image_url, display_order )
          )
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', {ascending: false});

      if (error) throw error;

      const liked = (data || [])
        .map((row: any) => row.posts)
        .filter((post: LikedPostItem | null): post is LikedPostItem => !!post);
      setPosts(liked);
    } catch (error) {
      console.error('❌ 좋아요한 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLikedPosts();
    }, [fetchLikedPosts]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLikedPosts();
  };

  if (loading) {
    return (
      <S.Center>
        <ActivityIndicator size="large" color="#191919" />
      </S.Center>
    );
  }

  return (
    <S.Container>
      <FlatList
        data={posts}
        numColumns={3}
        keyExtractor={item => item.id}
        contentContainerStyle={{flexGrow: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <S.Empty>
            <S.EmptyIcon
              source={require('../../assets/images/dduzi_image.png')}
              resizeMode="contain"
            />
            <S.EmptyText>좋아요한 게시물이 없어요</S.EmptyText>
            <S.EmptySubText>마음에 드는 게시물에 좋아요를 눌러보세요!</S.EmptySubText>
          </S.Empty>
        }
        renderItem={({item}) => {
          const firstImage = getFirstImageUrl(item);
          return (
            <S.GridItem
              style={{width: S.GRID_ITEM_SIZE, height: S.GRID_ITEM_SIZE}}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate(POST_ROUTES.POST_DETAIL, {postId: item.id})
              }>
              {firstImage ? (
                <>
                  <S.GridImage
                    source={{uri: thumbnailUrl(firstImage) ?? firstImage}}
                    resizeMode="cover"
                  />
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
        }}
      />
    </S.Container>
  );
}
