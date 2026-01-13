import {supabase} from '@/lib/supabase';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, View} from 'react-native';
import * as S from './PostDetailScreen.styles';

interface PostImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  yarn_info: string;
  pattern_info: string;
  pattern_url: string | null;
  needleInfo: string;
  created_at: string;
  updated_at: string;
  username: string;
  profile_image: string | null;
  images: PostImage[];
}

type RouteParams = {
  PostDetail: {
    postId: string;
  };
};

export default function PostDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'PostDetail'>>();
  const {postId} = route.params;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  const fetchPostDetail = async () => {
    try {
      setLoading(true);

      const {data: postData, error: postError} = await supabase
        .from('posts')
        .select(
          `
        id,
        title,
        content,
        yarn_info,
        pattern_info,
        pattern_url,
        needleInfo,
        created_at,
        updated_at,
        users!posts_user_id_fkey!inner(
          username,
          profile_image
        ),
        post_images (
          id,
          image_url,
          display_order
        )
      `,
        )
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('❌ 게시물 조회 실패:', postError);
        throw postError;
      }

      const postDetail: PostDetail = {
        id: (postData as any).id,
        title: (postData as any).title,
        content: (postData as any).content,
        yarn_info: (postData as any).yarn_info,
        pattern_info: (postData as any).pattern_info,
        pattern_url: (postData as any).pattern_url,
        needleInfo: (postData as any).needleInfo,
        created_at: (postData as any).created_at,
        updated_at: (postData as any).updated_at,
        username: (postData as any).users.username,
        profile_image: (postData as any).users.profile_image,
        images: ((postData as any).post_images || []).sort(
          (a: any, b: any) => a.display_order - b.display_order,
        ),
      };

      setPost(postDetail);
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('✅ 게시물 상세???', post?.images.length);

  if (loading) {
    return (
      <S.LoadingContainer>
        <ActivityIndicator size="large" color="#007AFF" />
        <S.LoadingText>로딩 중...</S.LoadingText>
      </S.LoadingContainer>
    );
  }

  if (!post) {
    return (
      <S.LoadingContainer>
        <S.ErrorText>게시물을 찾을 수 없습니다.</S.ErrorText>
      </S.LoadingContainer>
    );
  }

  return (
    <S.Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 작성자 정보 */}
        <S.AuthorSection>
          <S.AuthorInfo>
            {post.profile_image ? (
              <S.ProfileImage source={{uri: post.profile_image}} />
            ) : (
              <S.ProfilePlaceholder>
                <S.ProfilePlaceholderText>
                  {post.username.charAt(0)}
                </S.ProfilePlaceholderText>
              </S.ProfilePlaceholder>
            )}
            <S.AuthorTextContainer>
              <S.Username>{post.username}</S.Username>
              <S.Date>
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </S.Date>
            </S.AuthorTextContainer>
          </S.AuthorInfo>
        </S.AuthorSection>

        {/* 이미지 갤러리 */}
        {post.images.length > 0 && (
          <S.ImageGallery
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}>
            {post.images.map((image, index) => (
              <S.ImageWrapper key={image.id}>
                <S.PostImage
                  source={{uri: image.image_url}}
                  resizeMode="cover"
                />
                <S.ImageCounter>
                  {index + 1} / {post.images.length}
                </S.ImageCounter>
              </S.ImageWrapper>
            ))}
          </S.ImageGallery>
        )}

        {/* 게시물 내용 */}
        <S.ContentSection>
          <S.Title>{post.title}</S.Title>
          <S.Content>{post.content}</S.Content>

          {/* 구분선 */}
          <S.Divider />

          {/* 상세 정보 */}
          <S.InfoSection>
            <S.InfoTitle>프로젝트 정보</S.InfoTitle>

            <S.InfoRow>
              <S.InfoLabel>실 정보</S.InfoLabel>
              <S.InfoText>{post.yarn_info}</S.InfoText>
            </S.InfoRow>

            <S.InfoRow>
              <S.InfoLabel>바늘 정보</S.InfoLabel>
              <S.InfoText>{post.needleInfo}</S.InfoText>
            </S.InfoRow>

            {post.pattern_info && (
              <S.InfoRow>
                <S.InfoLabel>패턴 정보</S.InfoLabel>
                <S.InfoText>{post.pattern_info}</S.InfoText>
              </S.InfoRow>
            )}
          </S.InfoSection>

          {/* 도안 이미지 */}
          {post.pattern_url && (
            <>
              <S.Divider />
              <S.PatternSection>
                <S.InfoTitle>도안</S.InfoTitle>
                <S.PatternImage
                  source={{uri: post.pattern_url}}
                  resizeMode="contain"
                />
              </S.PatternSection>
            </>
          )}
        </S.ContentSection>
      </ScrollView>
    </S.Container>
  );
}
