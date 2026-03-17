import {supabase} from '@/lib/supabase';
import {RouteProp, useFocusEffect, useRoute} from '@react-navigation/native';
import {useState, useCallback, useRef, useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '@/contexts/AuthContext';
import * as S from './PostDetailScreen.styles';
import {PostDetail} from '@/@types/database';
import {completePost} from '@/lib/post/postUtils';
import CompletePostModal from '@/components/modal/CompletePostModal';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import Icon from 'react-native-vector-icons/Feather';

type RouteParams = {
  PostDetail: {
    postId: string;
  };
};

export default function PostDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'PostDetail'>>();
  const {navigation} = useCommonNavigation();
  const {user} = useAuth();
  const {postId} = route.params;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const hasFetchedRef = useRef(false);

  console.log('포스트상세', post);
  console.log('포스트 로딩', loading);

  const isMyPost = post && user && post.user_id === user.id;

  useFocusEffect(
    useCallback(() => {
      // 최초: post가 없으면 로딩 보여주기

      fetchPostDetail();
    }, [postId]),
  );

  useEffect(() => {
    hasFetchedRef.current = false;
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
            visibility
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
        images: ((postData as any).post_images || []).sort(
          (a: any, b: any) => a.display_order - b.display_order,
        ),
      };

      setPost(postDetail);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToProject = () => {
    if (!post?.project_id) return;
    navigation.navigate(POST_ROUTES.PROJECT_DETAIL, {
      projectId: post.project_id,
      projectTitle: post.title,
    });
  };

  const handleEdit = () => {
    setShowActionSheet(false);
    if (!post) return;
    navigation.navigate(POST_ROUTES.CREATE_POST_FOR_PROJECT, {
      mode: 'edit',
      postId: post.id,
      projectId: post.project_id,
      projectTitle: post.title,
      content: post.content,
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
            await supabase.from('post_images').delete().eq('post_id', postId);
            await supabase.from('posts').delete().eq('id', postId);
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

  const handleConfirmComplete = async (visibility: 'public' | 'private') => {
    if (!post) return;
    setLoading(true);
    try {
      const result = await completePost(post.id, visibility);
      if (result.success) {
        setPost({...post, is_completed: true, visibility});
        setModalVisible(false);
        Alert.alert(
          '완료',
          visibility === 'public'
            ? '프로젝트가 공개로 완료되었습니다.'
            : '프로젝트가 비공개로 완료되었습니다.',
          [{text: '확인', onPress: () => navigation.goBack()}],
        );
      } else {
        Alert.alert('오류', '프로젝트 완료 처리에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '프로젝트 완료 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
        <S.AuthorSection
          onPress={() =>
            navigation.navigate(POST_ROUTES.POSTS_MAIN, {userId: post.user_id})
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
          {isMyPost && (
            <TouchableOpacity onPress={() => setShowActionSheet(true)}>
              <S.MoreButton>⋯</S.MoreButton>
            </TouchableOpacity>
          )}
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
              <Icon name="folder" size={18} color="#8b5cf6" />
              <S.ProjectBannerTextGroup>
                <S.ProjectBannerLabel>연결된 프로젝트</S.ProjectBannerLabel>
                <S.ProjectBannerTitle numberOfLines={1}>
                  {post.title || '프로젝트 보기'}
                </S.ProjectBannerTitle>
              </S.ProjectBannerTextGroup>
            </S.ProjectBannerLeft>
            <S.ProjectBannerChevron>›</S.ProjectBannerChevron>
          </S.ProjectBanner>
        )}
      </ScrollView>

      {/* 액션시트 */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}>
        <S.ActionSheetOverlay onPress={() => setShowActionSheet(false)}>
          <S.ActionSheetContainer>
            <S.ActionSheetHandle />
            <S.ActionSheetButton onPress={handleEdit}>
              <S.ActionSheetIcon>✏️</S.ActionSheetIcon>
              <S.ActionSheetButtonText>수정하기</S.ActionSheetButtonText>
            </S.ActionSheetButton>
            <S.ActionSheetDivider />
            <S.ActionSheetButton onPress={handleDelete}>
              <S.ActionSheetIcon>🗑️</S.ActionSheetIcon>
              <S.ActionSheetButtonText isDestructive>
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </S.ActionSheetButtonText>
            </S.ActionSheetButton>
            <S.ActionSheetCancelButton
              onPress={() => setShowActionSheet(false)}>
              <S.ActionSheetCancelText>취소</S.ActionSheetCancelText>
            </S.ActionSheetCancelButton>
          </S.ActionSheetContainer>
        </S.ActionSheetOverlay>
      </Modal>

      <CompletePostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmComplete}
        loading={loading}
      />
    </S.Container>
  );
}
