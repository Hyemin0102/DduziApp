import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import * as S from './MyCommentsScreen.styles';
import {supabase} from '@/lib/supabase';
import {thumbnailUrl} from '@/lib/imageTransform';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {useAuth} from '@/contexts/AuthContext';

interface MyCommentItem {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post_content: string | null;
  post_thumbnail: string | null;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MyCommentsScreen() {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const [comments, setComments] = useState<MyCommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyComments = useCallback(async () => {
    if (!user) return;
    try {
      const {data, error} = await supabase
        .from('comments')
        .select(
          `
          id,
          content,
          created_at,
          post_id,
          posts (
            id,
            content,
            post_images ( id, image_url, display_order )
          )
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', {ascending: false});

      if (error) throw error;

      const mapped = (data || [])
        .filter((row: any) => !!row.posts)
        .map((row: any) => {
          const firstImage = [...(row.posts.post_images || [])].sort(
            (a: any, b: any) => a.display_order - b.display_order,
          )[0]?.image_url;
          return {
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            post_id: row.post_id,
            post_content: row.posts.content ?? null,
            post_thumbnail: firstImage ?? null,
          };
        });
      setComments(mapped);
    } catch (error) {
      console.error('❌ 내 댓글 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyComments();
    }, [fetchMyComments]),
  );

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
        data={comments}
        keyExtractor={item => item.id}
        contentContainerStyle={{flexGrow: 1}}
        ListEmptyComponent={
          <S.Empty>
            <S.EmptyIcon
              source={require('../../assets/images/dduzi_image.png')}
              resizeMode="contain"
            />
            <S.EmptyText>작성한 댓글이 없어요</S.EmptyText>
            <S.EmptySubText>게시물에 댓글을 남겨보세요!</S.EmptySubText>
          </S.Empty>
        }
        renderItem={({item}) => (
          <S.Row
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(POST_ROUTES.POST_DETAIL, {postId: item.post_id})
            }>
            {item.post_thumbnail ? (
              <S.Thumbnail
                source={{uri: thumbnailUrl(item.post_thumbnail) ?? item.post_thumbnail}}
                resizeMode="cover"
              />
            ) : (
              <S.ThumbnailPlaceholder>
                <S.PostPreview>🧶</S.PostPreview>
              </S.ThumbnailPlaceholder>
            )}
            <S.Body>
              <S.CommentText numberOfLines={2}>{item.content}</S.CommentText>
              {!!item.post_content && (
                <S.PostPreview numberOfLines={1}>{item.post_content}</S.PostPreview>
              )}
            </S.Body>
            <S.Time>{formatRelativeTime(item.created_at)}</S.Time>
          </S.Row>
        )}
      />
    </S.Container>
  );
}
