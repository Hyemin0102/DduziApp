import React, {useState, useCallback} from 'react';
import {
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import {RouteProp, useRoute, useFocusEffect} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {ProjectDetail, SimplePost} from '@/@types/database';
import Icon from 'react-native-vector-icons/Feather';
import CompletePostModal from '@/components/modal/CompletePostModal';
import * as S from './ProjectDetailScreen.styles';

type RouteProps = RouteProp<
  {ProjectDetail: {projectId: string; projectTitle?: string}},
  'ProjectDetail'
>;

export default function ProjectDetailScreen() {
  const route = useRoute<RouteProps>();
  const {navigation} = useCommonNavigation<any>();
  const {projectId} = route.params;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [posts, setPosts] = useState<SimplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [projectId]),
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const {data: projectData, error: projectError} = await supabase
        .from('projects')
        .select(
          `
          id, user_id, title, content, yarn_info, needle_info,
          pattern_info, pattern_url, is_completed, visibility,
          created_at, updated_at,
          knitting_logs ( id, project_id, content, created_at )
        `,
        )
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData as ProjectDetail);

      const {data: postsData, error: postsError} = await supabase
        .from('posts')
        .select(
          `
          id, user_id, project_id, content, created_at, updated_at,
          post_images ( id, post_id, image_url, display_order )
        `,
        )
        .eq('project_id', projectId)
        .order('created_at', {ascending: false});

      if (postsError) throw postsError;
      setPosts((postsData as SimplePost[]) || []);
    } catch (error) {
      console.error('프로젝트 상세 조회 실패:', error);
      Alert.alert('오류', '프로젝트 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isMyProject = project?.user_id === currentUserId;

  const handleAddPost = () => {
    navigation.navigate(PROJECTS_ROUTES.CREATE_POST_FOR_PROJECT, {
      projectId,
      projectTitle: project?.title,
    });
  };

  const handleGoToPost = (postId: string) => {
    navigation.navigate(POST_ROUTES.POST_DETAIL, {postId});
  };

  const handleEditProject = () => {
    if (!project) return;
    setShowActionSheet(false);
    navigation.navigate('PostCreate', {
      mode: 'edit',
      postData: {
        id: project.id,
        title: project.title,
        content: project.content || '',
        yarn_info: project.yarn_info || '',
        needle_info: project.needle_info || '',
        pattern_info: project.pattern_info || '',
        pattern_url: project.pattern_url || null,
        knitting_logs: project.knitting_logs || [],
      },
    });
  };

  const handleDeleteProject = () => {
    setShowActionSheet(false);
    Alert.alert(
      '프로젝트 삭제',
      '프로젝트와 관련 게시물이 모두 삭제됩니다. 계속하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const postIds = posts.map(p => p.id);
              if (postIds.length > 0) {
                await supabase
                  .from('post_images')
                  .delete()
                  .in('post_id', postIds);
                await supabase.from('posts').delete().in('id', postIds);
              }
              await supabase
                .from('knitting_logs')
                .delete()
                .eq('project_id', projectId);
              const {error} = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);
              if (error) throw error;
              Alert.alert('삭제 완료', '프로젝트가 삭제되었습니다.', [
                {text: '확인', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              console.error('프로젝트 삭제 실패:', error);
              Alert.alert('오류', '프로젝트 삭제에 실패했습니다.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirmComplete = async (visibility: 'public' | 'private') => {
    if (!project) return;
    try {
      const {error} = await supabase
        .from('projects')
        .update({is_completed: true, visibility})
        .eq('id', projectId);
      if (error) throw error;
      setProject({...project, is_completed: true, visibility});
      setCompleteModalVisible(false);
    } catch (error) {
      console.error('완료 처리 실패:', error);
      Alert.alert('오류', '완료 처리에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <S.Container>
        <ActivityIndicator size="large" color="#0070f3" />
      </S.Container>
    );
  }

  if (!project) {
    return (
      <S.Center>
        <S.EmptyText>프로젝트를 찾을 수 없어요.</S.EmptyText>
      </S.Center>
    );
  }

  return (
    <S.Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로젝트 정보 */}
        <S.Section>
          <S.TitleRow>
            <S.Title>{project.title}</S.Title>
            {isMyProject && (
              <TouchableOpacity onPress={() => setShowActionSheet(true)}>
                <Icon name="more-horizontal" size={22} color="#666" />
              </TouchableOpacity>
            )}
          </S.TitleRow>
          <S.Date>
            {new Date(project.created_at).toLocaleDateString('ko-KR')}
          </S.Date>
          <S.BadgeRow>
            <S.StatusBadge
              variant={project.is_completed ? 'completed' : 'progress'}>
              <S.StatusText
                variant={project.is_completed ? 'completed' : 'progress'}>
                {project.is_completed ? '✅ 완료' : '🧶 진행 중'}
              </S.StatusText>
            </S.StatusBadge>
            <S.StatusBadge
              variant={project.visibility === 'public' ? 'public' : 'private'}>
              <S.StatusText
                variant={
                  project.visibility === 'public' ? 'public' : 'private'
                }>
                {project.visibility === 'public' ? '🌐 공개' : '🔒 비공개'}
              </S.StatusText>
            </S.StatusBadge>
          </S.BadgeRow>
        </S.Section>

        <S.Section>
          <S.Label>프로젝트 설명</S.Label>
          {project.content ? (
            <S.Body>{project.content}</S.Body>
          ) : (
            <S.PlaceholderText>프로젝트에 대해 자유롭게 설명해주세요</S.PlaceholderText>
          )}
        </S.Section>

        <S.Section>
          <S.Label>실 정보</S.Label>
          {project.yarn_info ? (
            <S.Body>{project.yarn_info}</S.Body>
          ) : (
            <S.PlaceholderText>사용한 실의 브랜드, 색상, 두께 등</S.PlaceholderText>
          )}
        </S.Section>

        <S.Section>
          <S.Label>바늘 정보</S.Label>
          {project.needle_info ? (
            <S.Body>{project.needle_info}</S.Body>
          ) : (
            <S.PlaceholderText>사용한 바늘의 브랜드, 두께 등</S.PlaceholderText>
          )}
        </S.Section>

        <S.Section>
          <S.Label>도안 정보</S.Label>
          {project.pattern_info ? (
            <S.Body>{project.pattern_info}</S.Body>
          ) : (
            <S.PlaceholderText>사용한 도안에 대한 설명</S.PlaceholderText>
          )}
        </S.Section>

        <S.Section>
          <S.Label>도안 링크</S.Label>
          {project.pattern_url ? (
            <S.Link>{project.pattern_url}</S.Link>
          ) : (
            <S.PlaceholderText>https://...</S.PlaceholderText>
          )}
        </S.Section>

        {/* 게시물 목록 */}
        <S.Section>
          <S.PostHeaderRow>
            <S.Label>게시물 ({posts.length})</S.Label>
            {isMyProject && (
              <S.AddButton onPress={handleAddPost}>
                <Icon name="plus" size={16} color="#fff" />
                <S.AddButtonText>게시물 추가</S.AddButtonText>
              </S.AddButton>
            )}
          </S.PostHeaderRow>

          {posts.length === 0 ? (
            <S.EmptyPosts>
              <S.EmptyText>아직 게시물이 없어요</S.EmptyText>
              {isMyProject && (
                <S.EmptyAddButton onPress={handleAddPost}>
                  <S.EmptyAddButtonText>
                    첫 게시물 추가하기
                  </S.EmptyAddButtonText>
                </S.EmptyAddButton>
              )}
            </S.EmptyPosts>
          ) : (
            posts.map(post => (
              <S.PostCard
                key={post.id}
                onPress={() => handleGoToPost(post.id)}
                activeOpacity={0.8}>
                {post.post_images.length > 0 && (
                  <S.ImageScroll
                    horizontal
                    showsHorizontalScrollIndicator={false}>
                    {post.post_images
                      .slice()
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(img => (
                        <S.PostImage
                          key={img.id}
                          source={{uri: img.image_url}}
                        />
                      ))}
                  </S.ImageScroll>
                )}
                <S.PostContent>{post.content}</S.PostContent>
                <S.PostDate>
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </S.PostDate>
              </S.PostCard>
            ))
          )}
        </S.Section>

        {/* 뜨개 로그 */}
        <S.Section>
          <S.Label>뜨개 로그</S.Label>
          {project.knitting_logs && project.knitting_logs.length > 0 ? (
            project.knitting_logs
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )
              .map(log => (
                <S.LogItem key={log.id}>
                  <S.LogDate>
                    {new Date(log.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </S.LogDate>
                  <S.LogContent>{log.content}</S.LogContent>
                </S.LogItem>
              ))
          ) : (
            <S.PlaceholderText>오늘 뜬 내용을 기록해보세요</S.PlaceholderText>
          )}
        </S.Section>

        {/* 완료하기 버튼 */}
        {isMyProject && !project.is_completed && (
          <S.CompleteButton onPress={() => setCompleteModalVisible(true)}>
            <S.CompleteButtonText>완료하기</S.CompleteButtonText>
          </S.CompleteButton>
        )}

        <View style={{height: 40}} />
      </ScrollView>

      {/* 액션시트 */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}>
        <S.Overlay activeOpacity={1} onPress={() => setShowActionSheet(false)}>
          <S.ActionSheet>
            <S.ActionSheetHandle />
            <S.ActionSheetBtn onPress={handleEditProject}>
              <S.ActionSheetIcon>✏️</S.ActionSheetIcon>
              <S.ActionSheetText>수정하기</S.ActionSheetText>
            </S.ActionSheetBtn>
            <S.ActionSheetDivider />
            <S.ActionSheetBtn onPress={handleDeleteProject}>
              <S.ActionSheetIcon>🗑️</S.ActionSheetIcon>
              <S.DestructiveText>
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </S.DestructiveText>
            </S.ActionSheetBtn>
            <S.CancelBtn onPress={() => setShowActionSheet(false)}>
              <S.CancelText>취소</S.CancelText>
            </S.CancelBtn>
          </S.ActionSheet>
        </S.Overlay>
      </Modal>

      <CompletePostModal
        visible={completeModalVisible}
        onClose={() => setCompleteModalVisible(false)}
        onConfirm={handleConfirmComplete}
      />
    </S.Container>
  );
}
