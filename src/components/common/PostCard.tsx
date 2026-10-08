import React, {useState, useRef, useCallback} from 'react';
import {Alert, FlatList, Dimensions, ViewToken} from 'react-native';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {Post} from '@/@types/database';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import PinchZoomImage from './PinchZoomImage';
import Icon from 'react-native-vector-icons/Feather';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LikeBurst from './LikeBurst';
import SupporterBadge from './SupporterBadge';
import * as S from './PostCard.style';
import {thumbnailUrl, profileUrl} from '@/lib/imageTransform';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onLikeToggled?: (postId: string, liked: boolean) => void;
  onOpenComments?: (post: Post) => void;
  onOpenLikers?: (post: Post) => void;
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

const PostCard: React.FC<PostCardProps> = ({post, onLikeToggled, onOpenComments, onOpenLikers}) => {
  const {navigation} = useCommonNavigation();
  const {user} = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [likeBurstKey, setLikeBurstKey] = useState<number | null>(null);
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: heartScale.value}],
  }));
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

  // likes_count/is_liked/comments_count가 undefined면 이 화면(피드)이 배치 조회를
  // 안 하는 거라(예: Search) 액션바 자체를 숨김 — Home에서만 이 값들이 채워져 있음
  const isMyPost = !!user && post.user_id === user.id;
  const showActionBar =
    post.likes_count !== undefined &&
    post.is_liked !== undefined &&
    post.comments_count !== undefined;

  const handleToggleLike = async (e: any) => {
    e.stopPropagation?.();
    if (!user || isLikeLoading) return;
    setIsLikeLoading(true);
    const wasLiked = !!post.is_liked;
    heartScale.value = withSequence(
      withTiming(1.3, {duration: 100, easing: Easing.out(Easing.quad)}),
      withTiming(1, {duration: 150, easing: Easing.out(Easing.quad)}),
    );
    if (!wasLiked) setLikeBurstKey(k => (k ?? 0) + 1);
    onLikeToggled?.(post.id, !wasLiked);
    try {
      if (wasLiked) {
        const {error} = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const {error} = await supabase.from('likes').insert({post_id: post.id, user_id: user.id});
        if (error && error.code !== '23505') throw error;
      }
    } catch (error: any) {
      onLikeToggled?.(post.id, wasLiked);
      console.error('❌ 좋아요 처리 실패:', error);
      Alert.alert('오류', error?.message ?? '좋아요 처리 중 문제가 발생했습니다.');
    } finally {
      setIsLikeLoading(false);
    }
  };

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
        <S.UsernameRow>
          <S.Username>{post.users.nickname}</S.Username>
          {post.users.show_supporter_badge && post.users.supporter_level ? (
            <SupporterBadge level={post.users.supporter_level} size={20} />
          ) : null}
        </S.UsernameRow>
      </S.ProfileSection>

      {/* 이미지 */}
      {hasImages && (
        <>
          <S.ImageCarouselWrapper>
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={post.post_images}
              keyExtractor={(_, index) => String(index)}
              renderItem={({item}) => {
                const url = thumbnailUrl(item.image_url) ?? item.image_url;
                return (
                  <S.ImageContainer>
                    <PinchZoomImage uri={item.image_url}>
                      <PostImage uri={url} />
                    </PinchZoomImage>
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
            {multipleImages && (
              <S.ImageCounter>
                <S.ImageCounterText>
                  {activeIndex + 1} / {post.post_images.length}
                </S.ImageCounterText>
              </S.ImageCounter>
            )}
          </S.ImageCarouselWrapper>

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
            <S.StatusBadge status={post.projects.status}>
              <S.StatusBadgeText status={post.projects.status}>
                {post.projects.status === 'planned'
                  ? '예정'
                  : post.projects.status === 'completed'
                  ? '완료'
                  : '진행 중'}
              </S.StatusBadgeText>
            </S.StatusBadge>
            {showActionBar && (
              <S.ActionBar>
                {post.projects.likes_enabled && (
                  <S.ActionButton>
                    <S.ActionTouch
                      onPress={handleToggleLike}
                      disabled={isLikeLoading}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <S.LikeIconWrapper>
                        <Animated.View style={heartAnimatedStyle}>
                          <FA5Icon
                            name="heart"
                            solid={post.is_liked}
                            size={18}
                            color={post.is_liked ? '#FF3B30' : '#000'}
                          />
                        </Animated.View>
                        {likeBurstKey !== null && <LikeBurst key={likeBurstKey} />}
                      </S.LikeIconWrapper>
                    </S.ActionTouch>
                    {(post.likes_count ?? 0) > 0 &&
                      (isMyPost ? (
                        <S.ActionTouch
                          onPress={e => {
                            e.stopPropagation?.();
                            onOpenLikers?.(post);
                          }}
                          hitSlop={{top: 8, bottom: 8, left: 0, right: 8}}>
                          <S.ActionButtonText>{post.likes_count}</S.ActionButtonText>
                        </S.ActionTouch>
                      ) : (
                        <S.ActionButtonText>{post.likes_count}</S.ActionButtonText>
                      ))}
                  </S.ActionButton>
                )}
                {post.projects.comments_enabled && (
                  <S.ActionButton>
                    <S.ActionTouch
                      onPress={e => {
                        e.stopPropagation?.();
                        onOpenComments?.(post);
                      }}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <FA5Icon name="comment" solid={false} size={18} color="#000" />
                    </S.ActionTouch>
                    {(post.comments_count ?? 0) > 0 && (
                      <S.ActionButtonText>{post.comments_count}</S.ActionButtonText>
                    )}
                  </S.ActionButton>
                )}
              </S.ActionBar>
            )}
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
