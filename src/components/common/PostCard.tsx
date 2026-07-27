import React, {useState, useRef, useCallback} from 'react';
import {FlatList, Dimensions, ViewToken} from 'react-native';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {Post} from '@/@types/database';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import PinchZoomImage from './PinchZoomImage';
import Icon from 'react-native-vector-icons/Feather';
import * as S from './PostCard.style';
import {thumbnailUrl, profileUrl} from '@/lib/imageTransform';

interface PostCardProps {
  post: Post;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = Math.min(SCREEN_WIDTH, 500);

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
  const [isTruncated, setIsTruncated] = useState(false);
  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;
  const viewabilityConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;
  const content = post.content ?? '';
  const hasImages = post.post_images && post.post_images.length > 0;
  const multipleImages = hasImages && post.post_images.length > 1;


  const profileInitial = post.users.nickname?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <S.CardContainer>
      {/* 프로필 */}
      <S.ProfileSection
        onPress={() =>
          navigation.push(POST_ROUTES.POSTS_MAIN, {userId: post.user_id})
        }>
        {post.users.profile_image ? (
          <S.ProfileImage
            source={{
              uri:
                profileUrl(post.users.profile_image) ??
                post.users.profile_image,
            }}
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
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={post.post_images}
            keyExtractor={(_, index) => String(index)}
            renderItem={({item, index}) => {
              const url = thumbnailUrl(item.image_url) ?? item.image_url;
              return (
                <S.ImageContainer>
                  <PinchZoomImage uri={item.image_url}>
                    <PostImage uri={url} />
                  </PinchZoomImage>
                  {multipleImages && (
                    <S.ImageCounter>
                      <S.ImageCounterText>
                        {index + 1} / {post.post_images.length}
                      </S.ImageCounterText>
                    </S.ImageCounter>
                  )}
                </S.ImageContainer>
              );
            }}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            initialNumToRender={1}
            windowSize={3}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            style={{height: IMAGE_HEIGHT}}
          />

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
          navigation.navigate(POST_ROUTES.POST_DETAIL, {postId: post.id})
        }>
        {post.projects && (
          <S.BadgeRow>
            <S.ProjectBadge>
              <S.ProjectBadgeText numberOfLines={1}>
                <Icon name="folder" size={12} color="#555" />{' '}
                {post.projects.title}
              </S.ProjectBadgeText>
            </S.ProjectBadge>
            <S.StatusBadge completed={post.projects.is_completed}>
              <S.StatusBadgeText completed={post.projects.is_completed}>
                {post.projects.is_completed ? '완료' : '진행 중'}
              </S.StatusBadgeText>
            </S.StatusBadge>
          </S.BadgeRow>
        )}
        <S.Content numberOfLines={2} ellipsizeMode="clip">
          {content}
        </S.Content>
        <S.Content
          style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}}
          onTextLayout={e => {
            setIsTruncated(e.nativeEvent.lines.length > 2);
          }}>
          {content}
        </S.Content>
        {isTruncated && <S.More>...더보기</S.More>}
        <S.Date>{new Date(post.created_at).toLocaleDateString('ko-KR')}</S.Date>
      </S.ContentSection>
    </S.CardContainer>
  );
};

export default PostCard;
