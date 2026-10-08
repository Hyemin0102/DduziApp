import {supabase} from '@/lib/supabase';
import {RouteProp, useFocusEffect, useRoute} from '@react-navigation/native';
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Dimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '@/contexts/AuthContext';
import * as S from './PostDetailScreen.styles';
import {PostDetail} from '@/@types/database';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import PostLikersSheet from '@/components/common/PostLikersSheet';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import PinchZoomImage from '@/components/common/PinchZoomImage';
import PostCommentsSheet from '@/components/common/PostCommentsSheet';
import {
  PROJECTS_ROUTES,
  POST_ROUTES,
  ROOT_ROUTES,
  TAB_ROUTES,
} from '@/constants/navigation.constant';
import {deletePostImageFileIfUnused} from '@/lib/uploadImage';
import Icon from 'react-native-vector-icons/Feather';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LikeBurst from '@/components/common/LikeBurst';
import {trackEvent} from '@/lib/mixpanel';
import SaveIcon from '@/assets/icons/save.svg';
import SavedIcon from '@/assets/icons/saved.svg';
import {POST_IMAGE_ASPECT_RATIO} from '@/constants/postImage.constant';
import {REPORT_REASONS} from '@/constants/report.constant';
import BottomBannerAd from '@/components/common/BottomBannerAd';

// 토스트에서 "내 뜨개함에 담았어요." 문구는 절대 안 잘리게, 프로젝트명만 줄여서 "..." 처리
const truncateForToast = (title: string, maxLen = 8) =>
  title.length > maxLen ? `${title.slice(0, maxLen)}...` : title;

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
// 기존(레거시) 게시물과 동일한 정사각형 프레임으로 고정 — 화면 모양은 그대로 두고
// resizeMode만 cover→contain으로 바꿔서 잘리지 않게 함 (스와이프해도 프레임 높이는 안 바뀜)
const GALLERY_HEIGHT = Math.min(
  SCREEN_WIDTH / POST_IMAGE_ASPECT_RATIO,
  SCREEN_HEIGHT * 0.8,
);

type RouteParams = {
  PostDetail: {
    postId: string;
  };
};

export default function PostDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'PostDetail'>>();
  const {navigation, rootNavigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const {postId} = route.params;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showReportReasonSheet, setShowReportReasonSheet] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const hasFetchedRef = useRef(false);
  const viewTrackedRef = useRef(false);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 좋아요
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [likeBurstKey, setLikeBurstKey] = useState<number | null>(null);
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: heartScale.value}],
  }));

  // 댓글 — 목록/작성 등 바텀시트 내부 로직은 PostCommentsSheet가 전담, 여기선
  // 액션 바에 보여줄 카운트와 바텀시트 열림 여부만 관리
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    };
  }, []);

  const isMyPost = post && user && post.user_id === user.id;
  const [showLikersSheet, setShowLikersSheet] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // 최초: post가 없으면 로딩 보여주기

      fetchPostDetail();
    }, [postId]),
  );

  useEffect(() => {
    hasFetchedRef.current = false;
    viewTrackedRef.current = false;
  }, [postId]);


  const fetchPostDetail = async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);

      const {data: postData, error: postError} = await supabase
        .from('posts')
        .select(
          `
          id,
          user_id,
          project_id,
          content,
          created_at,
          updated_at,
          users!posts_user_id_fkey!inner(
            nickname,
            profile_image
          ),
          post_images (
            id,
            image_url,
            display_order
          ),
          projects (
            id,
            title,
            yarn_info,
            needle_info,
            pattern_info,
            pattern_url,
            is_completed,
            visibility,
            likes_enabled,
            comments_enabled
          )
        `,
        )
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      const project = (postData as any).projects;

      const postDetail: PostDetail = {
        id: (postData as any).id,
        user_id: (postData as any).user_id,
        project_id: (postData as any).project_id,
        content: (postData as any).content,
        created_at: (postData as any).created_at,
        updated_at: (postData as any).updated_at,
        nickname: (postData as any).users.nickname,
        profile_image: (postData as any).users.profile_image,
        title: project?.title,
        yarn_info: project?.yarn_info,
        needle_info: project?.needle_info,
        pattern_info: project?.pattern_info,
        pattern_url: project?.pattern_url,
        is_completed: project?.is_completed,
        visibility: project?.visibility,
        likes_enabled: project?.likes_enabled ?? true,
        comments_enabled: project?.comments_enabled ?? true,
        likes_count: 0,
        is_liked: false,
        images: ((postData as any).post_images || []).sort(
          (a: any, b: any) => a.display_order - b.display_order,
        ),
      };

      const {count: likesCountResult} = await supabase
        .from('likes')
        .select('id', {count: 'exact', head: true})
        .eq('post_id', postId);
      postDetail.likes_count = likesCountResult ?? 0;
      setLikesCount(likesCountResult ?? 0);

      const {count: commentsCountResult} = await supabase
        .from('comments')
        .select('id', {count: 'exact', head: true})
        .eq('post_id', postId);
      setCommentsCount(commentsCountResult ?? 0);

      if (user) {
        const {data: likeData} = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        postDetail.is_liked = !!likeData;
        setIsLiked(!!likeData);
      }

      setPost(postDetail);
      hasFetchedRef.current = true;

      if (!viewTrackedRef.current) {
        viewTrackedRef.current = true;
        trackEvent('post_viewed', {
          post_id: postDetail.id,
          owner_id: postDetail.user_id,
          is_own_content: user ? postDetail.user_id === user.id : false,
        });
      }

      // 저장 여부 조회 (본인 프로젝트도 뜨개함에 보관 가능)
      if (user && project?.id) {
        const {data: savedData} = await supabase
          .from('saved_projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('project_id', project.id)
          .maybeSingle();
        setIsSaved(!!savedData);
      }
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !post?.project_id || isSaveLoading) return;
    setIsSaveLoading(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_projects')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', post.project_id);
        setIsSaved(false);
        trackEvent('project_unsaved', {project_id: post.project_id});
      } else {
        await supabase
          .from('saved_projects')
          .insert({user_id: user.id, project_id: post.project_id});
        setIsSaved(true);
        trackEvent('project_saved', {project_id: post.project_id});

        setShowSaveToast(true);
        if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
        saveToastTimerRef.current = setTimeout(() => setShowSaveToast(false), 3000);
      }
    } catch (error) {
      console.error('❌ 뜨개함 저장 실패:', error);
      Alert.alert('오류', '뜨개함 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSaveLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!user || !post || isLikeLoading) return;
    setIsLikeLoading(true);
    const wasLiked = isLiked;
    heartScale.value = withSequence(
      withTiming(1.3, {duration: 100, easing: Easing.out(Easing.quad)}),
      withTiming(1, {duration: 150, easing: Easing.out(Easing.quad)}),
    );
    try {
      if (wasLiked) {
        setIsLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
        const {error} = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
        trackEvent('post_unliked', {post_id: post.id});
      } else {
        setIsLiked(true);
        setLikesCount(c => c + 1);
        setLikeBurstKey(k => (k ?? 0) + 1);
        const {error} = await supabase
          .from('likes')
          .insert({post_id: post.id, user_id: user.id});
        if (error && error.code !== '23505') throw error;
        trackEvent('post_liked', {post_id: post.id});
      }
    } catch (error: any) {
      setIsLiked(wasLiked);
      setLikesCount(c => (wasLiked ? c + 1 : Math.max(0, c - 1)));
      console.error('❌ 좋아요 처리 실패:', error);
      Alert.alert('오류', error?.message ?? '좋아요 처리 중 문제가 발생했습니다.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleGoToProject = () => {
    if (!post?.project_id) return;
    navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
      projectId: post.project_id,
      projectTitle: post.title,
    });
  };

  const handleGoToSavedProjects = () => {
    setShowSaveToast(false);
    if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    rootNavigation.navigate(ROOT_ROUTES.TAB_NAVIGATOR, {
      screen: TAB_ROUTES.PROJECTS_TAB,
      params: {
        screen: PROJECTS_ROUTES.PROJECTS_MAIN,
        params: {initialTab: 'saved'},
      },
    });
  };

  const handleEdit = () => {
    setShowActionSheet(false);
    if (!post) return;
    navigation.navigate(POST_ROUTES.CREATE_POST_FOR_PROJECT, {
      mode: 'edit' as const,
      postId: post.id,
      projectId: post.project_id ?? undefined,
      projectTitle: post.title,
      content: post.content ?? undefined,
      existingImages: post.images,
    });
  };

  const handleDelete = () => {
    Alert.alert('게시물 삭제', '정말 이 게시물을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            const imageUrls = (post?.images ?? []).map(img => img.image_url);
            // Storage DELETE 정책이 posts.user_id 서브쿼리로 소유권을 확인하므로,
            // posts 행을 지우기 전에 먼저 스토리지 파일을 정리해야 함
            await Promise.all(imageUrls.map(url => deletePostImageFileIfUnused(url)));
            await supabase.from('post_images').delete().eq('post_id', postId);
            await supabase.from('posts').delete().eq('id', postId);
            DeviceEventEmitter.emit('postDeleted', {postId});
            Alert.alert('삭제 완료', '게시물이 삭제되었습니다.', [
              {text: '확인', onPress: () => navigation.goBack()},
            ]);
          } catch (error) {
            console.error('❌ 게시물 삭제 실패:', error);
            Alert.alert('오류', '게시물 삭제에 실패했습니다.');
          } finally {
            setIsDeleting(false);
            setShowActionSheet(false);
          }
        },
      },
    ]);
  };

  const handleReport = async (reason: string) => {
    if (!user || !post) return;
    try {
      setIsReporting(true);
      const {error: insertError} = await supabase.from('reports').insert({
        reporter_id: user.id,
        post_id: post.id,
        reason,
        project_id: post.project_id,
        project_title: post.title,
      });
      if (insertError) {
        if (insertError.code === '23505') {
          Alert.alert('알림', '이미 신고한 게시물입니다.');
          return;
        }
        throw insertError;
      }
      trackEvent('post_reported', {post_id: post.id, reason});
      const {error: fnError} = await supabase.functions.invoke('send-report-email', {
        body: {
          reporterId: user.id,
          reporterNickname: user.nickname ?? '알 수 없음',
          postId: post.id,
          postContent: post.content,
          projectId: post.project_id,
          projectTitle: post.title,
          reportType: 'post',
          reason,
        },
      });
      if (fnError) {
        console.error('❌ 신고 이메일 발송 실패:', fnError);
      }
      Alert.alert('신고 완료', '신고가 접수되었습니다. 24시간 내에 검토 후 처리하겠습니다.');
    } catch (error) {
      console.error('❌ 신고 실패:', error);
      Alert.alert('오류', '신고 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsReporting(false);
      setShowReportReasonSheet(false);
    }
  };

  if (loading) {
    return (
      <S.LoadingContainer>
        <ActivityIndicator size="large" color="#191919" />
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
      <PostCommentsSheet
        inline
        visible
        onClose={() => {}}
        postId={post.id}
        postOwnerId={post.user_id}
        postContent={post.content ?? null}
        projectId={post.project_id}
        projectTitle={post.title}
        onCommentsCountChange={setCommentsCount}
        headerComponent={
          <View>
        {/* 작성자 정보 */}
        <S.AuthorSection
          onPress={() =>
            navigation.push(POST_ROUTES.POSTS_MAIN, {userId: post.user_id})
          }>
          <S.AuthorInfo>
            {post.profile_image ? (
              <S.ProfileImage source={{uri: post.profile_image}} />
            ) : (
              <S.ProfilePlaceholder>
                <S.ProfilePlaceholderText>
                  {post.nickname.charAt(0)}
                </S.ProfilePlaceholderText>
              </S.ProfilePlaceholder>
            )}
            <S.AuthorTextContainer>
              <S.Username>{post.nickname}</S.Username>
              <S.Date>
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </S.Date>
            </S.AuthorTextContainer>
          </S.AuthorInfo>
          {isMyPost ? (
            <TouchableOpacity onPress={() => setShowActionSheet(true)}>
              <S.MoreButton>⋯</S.MoreButton>
            </TouchableOpacity>
          ) : post ? (
            <TouchableOpacity onPress={() => setShowReportSheet(true)}>
              <S.MoreButton>⋯</S.MoreButton>
            </TouchableOpacity>
          ) : null}
        </S.AuthorSection>

        {/* 이미지 갤러리 */}
        {post.images.length > 0 && (
          <>
            <S.ImageGalleryWrapper>
              <S.ImageGallery
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={e =>
                  setActiveImageIndex(
                    Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
                  )
                }
                style={{height: GALLERY_HEIGHT}}>
                {post.images.map(image => (
                  <S.ImageWrapper key={image.id} style={{height: GALLERY_HEIGHT}}>
                    <PinchZoomImage uri={image.image_url}>
                      <S.PostImage
                        source={{uri: image.image_url}}
                        resizeMode="contain"
                      />
                    </PinchZoomImage>
                  </S.ImageWrapper>
                ))}
              </S.ImageGallery>
              {post.images.length > 1 && (
                <S.ImageCounter>
                  <S.ImageCounterText>
                    {activeImageIndex + 1} / {post.images.length}
                  </S.ImageCounterText>
                </S.ImageCounter>
              )}
            </S.ImageGalleryWrapper>
            <S.ImageGalleryDivider />
          </>
        )}

                {/* 좋아요/댓글 액션 바 */}
        <S.ActionBar>
          {post.likes_enabled && (
            <S.ActionButton>
              <S.ActionTouch
                onPress={handleToggleLike}
                disabled={isLikeLoading}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <S.LikeIconWrapper>
                  <Animated.View style={heartAnimatedStyle}>
                    <FA5Icon
                      name="heart"
                      solid={isLiked}
                      size={18}
                      color={isLiked ? '#FF3B30' : '#191919'}
                    />
                  </Animated.View>
                  {likeBurstKey !== null && <LikeBurst key={likeBurstKey} />}
                </S.LikeIconWrapper>
              </S.ActionTouch>
              {likesCount > 0 &&
                (isMyPost ? (
                  <S.ActionTouch
                    onPress={() => setShowLikersSheet(true)}
                    hitSlop={{top: 8, bottom: 8, left: 0, right: 8}}>
                    <S.ActionButtonText>{likesCount}</S.ActionButtonText>
                  </S.ActionTouch>
                ) : (
                  <S.ActionButtonText>{likesCount}</S.ActionButtonText>
                ))}
            </S.ActionButton>
          )}
          {post.comments_enabled && (
            <S.ActionButton>
              <S.ActionIconPad>
                <FA5Icon name="comment" solid={false} size={18} color="#191919" />
              </S.ActionIconPad>
              {commentsCount > 0 && <S.ActionButtonText>{commentsCount}</S.ActionButtonText>}
            </S.ActionButton>
          )}
        </S.ActionBar>

        {/* 게시물 내용 */}
        <S.ContentSection>
          {post.visibility === 'private' && (
            <S.PrivateBadge>
              <Icon name="lock" size={11} color="#888" />
              <S.PrivateBadgeText>비공개</S.PrivateBadgeText>
            </S.PrivateBadge>
          )}
          <S.Content>{post.content}</S.Content>
        </S.ContentSection>



        {/* 연결된 프로젝트 */}
        {post.project_id && (
          <S.ProjectBanner onPress={handleGoToProject} activeOpacity={0.8}>
            <S.ProjectBannerLeft>
              <TouchableOpacity
                onPress={e => {
                  e.stopPropagation?.();
                  handleToggleSave();
                }}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                disabled={isSaveLoading}>
                {isSaved ? (
                  <SavedIcon width={32} height={32}  color="#000000"/>
                ) : (
                  <SaveIcon width={32} height={32} color="#000000"/>
                )}
              </TouchableOpacity>
              <S.ProjectBannerDivider />
              <S.ProjectBannerTextGroup>
                <S.ProjectBannerLabel>연결된 프로젝트</S.ProjectBannerLabel>
                <S.ProjectBannerTitle numberOfLines={1}>
                  {post.title || '프로젝트 보기'}
                </S.ProjectBannerTitle>
              </S.ProjectBannerTextGroup>
            </S.ProjectBannerLeft>
            <S.ProjectBannerRight>
              <S.ProjectBannerChevron>›</S.ProjectBannerChevron>
            </S.ProjectBannerRight>
          </S.ProjectBanner>
        )}

          </View>
        }
      />

      {/* 뜨개함 저장 토스트 */}
      {showSaveToast && (
        <S.SaveToast onPress={handleGoToSavedProjects} activeOpacity={0.85}>
          <S.SaveToastText>
          내 뜨개함에 담았어요.
            {/* {post.title ? `${truncateForToast(post.title)}를 ` : ''}내 뜨개함에 담았어요. */}
          </S.SaveToastText>
          <S.SaveToastAction>바로가기</S.SaveToastAction>
        </S.SaveToast>
      )}


      {/* 액션시트 */}
      <ActionSheetModal
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        actions={[
          {label: '수정하기',  onPress: handleEdit},
          {label: isDeleting ? '삭제 중...' : '삭제하기', onPress: handleDelete, isDestructive: true},
        ]}
      />

      <PostLikersSheet
        visible={showLikersSheet}
        onClose={() => setShowLikersSheet(false)}
        postId={post.id}
      />

      <ActionSheetModal
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        actions={[
          {label: '신고하기', onPress: () => {
            setShowReportSheet(false);
            setTimeout(() => setShowReportReasonSheet(true), 300);
          }, isDestructive: true},
        ]}
      />

      <ActionSheetModal
        visible={showReportReasonSheet}
        onClose={() => setShowReportReasonSheet(false)}
        actions={REPORT_REASONS.map(item => ({
          label: item.label,
          onPress: () => handleReport(item.reason),
        }))}
      />


      {isReporting && (
        <S.ActionLoadingOverlay>
          <ActivityIndicator size="large" color="#fff" />
          <S.ActionLoadingText>신고 접수 중...</S.ActionLoadingText>
        </S.ActionLoadingOverlay>
      )}
    </S.Container>
  );
}
