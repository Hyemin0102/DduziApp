import {supabase} from '@/lib/supabase';
import {RouteProp, useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {useState, useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '@/contexts/AuthContext';
import * as S from './PostDetailScreen.styles';
import { PostDetail } from '@/@types/post';
import { completePost } from '@/lib/post/postUtils';
import CompletePostModal from '@/components/modal/CompletePostModal';
import useCommonNavigation from '@/hooks/useCommonNavigation';

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
  console.log('상세???' , post);
  
  // 내 게시물인지 확인
  const isMyPost = post && user && post.user_id === user.id;

  useFocusEffect(
    useCallback(() => {
      fetchPostDetail();
    }, [postId]),
  );

  const fetchPostDetail = async () => {
    try {
      setLoading(true);

      const {data: postData, error: postError} = await supabase
        .from('posts')
        .select(
          `
        id,
        user_id,
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
        ),
         knitting_logs (
          id,
          content,
          created_at
        ),
        is_completed,
        visibility
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
        user_id: (postData as any).user_id,
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
        is_completed: (postData as any).is_completed,
        visibility: (postData as any).visibility,
        images: ((postData as any).post_images || []).sort(
          (a: any, b: any) => a.display_order - b.display_order,
        ),
        knitting_logs: ((postData as any).knitting_logs || []).sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ), // 최신순 정렬
      };

      setPost(postDetail);
    } catch (error) {
      console.error('❌ 게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 게시물 삭제
  const handleDelete = () => {
    Alert.alert('게시물 삭제', '정말 이 게시물을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);

            // 관련 데이터 삭제 (cascade 설정이 없다면 수동 삭제)
            await supabase.from('knitting_logs').delete().eq('post_id', postId);
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

  // 게시물 수정 화면으로 이동
  const handleEdit = () => {
    setShowActionSheet(false);
    navigation.navigate('CreatePost', {
      mode: 'edit',
      postData: post,
    });
  };

  // 완료 버튼 클릭
  const handleCompletePress = () => {
    setModalVisible(true);
  };

  const handleConfirmComplete = async (visibility: 'public' | 'private') => {
    if (!post) return;

    setLoading(true);

    try {
      const result = await completePost(post.id, visibility);

      if (result.success) {
        // 로컬 상태 업데이트
        setPost({
          ...post,
          is_completed: true,
          visibility: visibility,
        });

        setModalVisible(false);

        Alert.alert(
          '완료',
          visibility === 'public'
            ? '프로젝트가 공개로 완료되었습니다.'
            : '프로젝트가 비공개로 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('오류', '프로젝트 완료 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('완료 처리 에러:', error);
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
          {/* 내 게시물일 때 더보기 버튼 */}
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
          {/* 뜨개 로그 */}
          {post.knitting_logs && post.knitting_logs.length > 0 && (
            <>
              <S.Divider />
              <S.LogSection>
                <S.LogTitle>🧶 뜨개 일지</S.LogTitle>
                <S.Timeline>
                  {post.knitting_logs.map((log, index) => (
                    <S.TimelineItem key={log.id}>
                      {/* 타임라인 점 */}
                      <S.TimelineDot isFirst={index === 0} />

                      {/* 타임라인 선 */}
                      {index !== post.knitting_logs.length - 1 && (
                        <S.TimelineLine />
                      )}

                      {/* 로그 내용 */}
                      <S.LogContent>
                        <S.LogDate>
                          {new Date(log.created_at).toLocaleDateString(
                            'ko-KR',
                            {
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </S.LogDate>
                        <S.LogText>{log.content}</S.LogText>
                      </S.LogContent>
                    </S.TimelineItem>
                  ))}
                </S.Timeline>
              </S.LogSection>
            </>
          )}
        </S.ContentSection>

        {!post?.is_completed && isMyPost && (
        <TouchableOpacity
          onPress={handleCompletePress}
          style={{
            backgroundColor: '#007AFF',
            padding: 16,
            margin: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}>
          <Text style={{color: '#fff', fontSize: 16, fontWeight: '600'}}>
            프로젝트 완료하기
          </Text>
        </TouchableOpacity>
      )}
{post?.is_completed && isMyPost && (
        <View
          style={{
            backgroundColor: '#F0F8FF',
            padding: 16,
            margin: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View>
            <Text style={{fontSize: 16, fontWeight: '600', color: '#007AFF'}}>
              완료된 프로젝트
            </Text>
            <Text style={{fontSize: 13, color: '#666', marginTop: 4}}>
              {post.visibility === 'public' ? '공개' : '비공개'}
            </Text>
          </View>
          <Text style={{fontSize: 24}}>✓</Text>
        </View>
      )}
      </ScrollView>

      {/* 액션시트 (수정/삭제) */}
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
                삭제하기
              </S.ActionSheetButtonText>
            </S.ActionSheetButton>
            <S.ActionSheetCancelButton onPress={() => setShowActionSheet(false)}>
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
