import React, {useState} from 'react';
import {ScrollView, TouchableOpacity, Dimensions} from 'react-native';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {Post} from '@/@types/database';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import * as S from './PostCard.style';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const PostImage = ({uri}: {uri: string}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <S.ImagePlaceholder>
      <S.PostImage
        source={{uri}}
        onLoadEnd={() => setLoaded(true)}
        style={{opacity: loaded ? 1 : 0}}
      />
    </S.ImagePlaceholder>
  );
};

const PostCard: React.FC<PostCardProps> = ({post}) => {
  const {navigation} = useCommonNavigation();

  return (
    <S.CardContainer>
      <S.ProfileSection
        onPress={() =>
          navigation.navigate(POST_ROUTES.POSTS_MAIN, {userId: post.user_id})
        }>
        <S.ProfileImage
          source={{uri: post.users.profile_image}}
          resizeMode="cover"
        />
        <S.Username>{post.users.nickname}</S.Username>
      </S.ProfileSection>

      {post.post_images && post.post_images.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCREEN_WIDTH - 36}
          decelerationRate="fast"
          contentContainerStyle={{flexGrow: 1}}
          style={{height: 200}}>
          {post.post_images.map((image, index) => (
            <S.ImageContainer key={index} style={{width: SCREEN_WIDTH - 36}}>
              <PostImage uri={image.image_url} />
              {post.post_images.length > 1 && (
                <S.ImageCounter>
                  {index + 1} / {post.post_images.length}
                </S.ImageCounter>
              )}
            </S.ImageContainer>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('PostDetail', {postId: post.id})}>
        <S.ContentSection>
          {post.projects && (
            <S.BadgeRow>
              <S.ProjectBadge>
                <S.ProjectBadgeText numberOfLines={1}>
                  🧶 {post.projects.title}
                </S.ProjectBadgeText>
              </S.ProjectBadge>
              <S.StatusBadge completed={post.projects.is_completed}>
                <S.StatusBadgeText completed={post.projects.is_completed}>
                  {post.projects.is_completed ? '✅ 완료' : '진행 중'}
                </S.StatusBadgeText>
              </S.StatusBadge>
            </S.BadgeRow>
          )}
          <S.Content numberOfLines={3}>{post.content}</S.Content>
          <S.Date>
            {new Date(post.created_at).toLocaleDateString('ko-KR')}
          </S.Date>
        </S.ContentSection>
      </TouchableOpacity>
    </S.CardContainer>
  );
};

export default PostCard;
