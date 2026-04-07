import React, {useState} from 'react';
import {ScrollView, Dimensions} from 'react-native';
import {POST_ROUTES, ROOT_ROUTES, TAB_ROUTES} from '@/constants/navigation.constant';
import {Post} from '@/@types/database';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import * as S from './PostCard.style';

interface PostCardProps {
  post: Post;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const PostImage = ({uri}: {uri: string}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <S.ImagePlaceholder>
      <S.PostImage
        source={{uri}}
        resizeMode="cover"
        onLoadEnd={() => setLoaded(true)}
        style={{opacity: loaded ? 1 : 0}}
      />
    </S.ImagePlaceholder>
  );
};

const PostCard: React.FC<PostCardProps> = ({post}) => {
  const {navigation} = useCommonNavigation();
  const [activeIndex, setActiveIndex] = useState(0);

  const hasImages = post.post_images && post.post_images.length > 0;
  const multipleImages = hasImages && post.post_images.length > 1;

  const profileInitial = post.users.nickname?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <S.CardContainer>
      {/* 프로필 */}
      <S.ProfileSection
        onPress={() =>
          navigation.navigate('PostsMain', {userId: post.user_id})
        }>
        {post.users.profile_image ? (
          <S.ProfileImage
            source={{uri: post.users.profile_image}}
            resizeMode="cover"
          />
        ) : (
          <S.ProfileImagePlaceholder>
            <S.ProfileImagePlaceholderText>
              {profileInitial}
            </S.ProfileImagePlaceholderText>
          </S.ProfileImagePlaceholder>
        )}
        <S.Username>{post.users.nickname}</S.Username>
      </S.ProfileSection>

      {/* 이미지 */}
      {hasImages && (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={e => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setActiveIndex(idx);
            }}
            style={{height: SCREEN_WIDTH}}>
            {post.post_images.map((image, index) => (
              <S.ImageContainer key={index}>
                <PostImage uri={image.image_url} />
                {multipleImages && (
                  <S.ImageCounter>
                    <S.ImageCounterText>
                      {index + 1} / {post.post_images.length}
                    </S.ImageCounterText>
                  </S.ImageCounter>
                )}
              </S.ImageContainer>
            ))}
          </ScrollView>

          {/* 이미지 dots */}
          {multipleImages && (
            <S.DotsRow>
              {post.post_images.map((_, i) => (
                <S.Dot key={i} active={i === activeIndex} />
              ))}
            </S.DotsRow>
          )}
        </>
      )}

      {/* 콘텐츠 */}
      <S.ContentSection
        onPress={() => 
          navigation.navigate('PostDetail', { postId: post.id })
        }>
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
        {(() => {
          const lines = (post.content ?? '').split('\n');
          const preview = lines.slice(0, 2).join('\n');
          const hasMore = lines.length > 2;
          return (
            <>
              <S.Content>{preview}</S.Content>
              {hasMore && <S.More>...</S.More>}
            </>
          );
        })()}
        <S.Date>
          {new Date(post.created_at).toLocaleDateString('ko-KR')}
        </S.Date>
      </S.ContentSection>
    </S.CardContainer>
  );
};

export default PostCard;
