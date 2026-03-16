import React, {useState, useCallback} from 'react';
import {
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import {RouteProp, useRoute, useFocusEffect} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {ProjectDetail, SimplePost} from '@/@types/database';
import Icon from 'react-native-vector-icons/Feather';
import CompletePostModal from '@/components/modal/CompletePostModal';

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0070f3" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>프로젝트를 찾을 수 없어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로젝트 정보 */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{project.title}</Text>
            {isMyProject && (
              <TouchableOpacity onPress={() => setShowActionSheet(true)}>
                <Icon name="more-horizontal" size={22} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.date}>
            {new Date(project.created_at).toLocaleDateString('ko-KR')}
          </Text>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                project.is_completed
                  ? styles.badgeCompleted
                  : styles.badgeProgress,
              ]}>
              <Text
                style={[
                  styles.statusText,
                  project.is_completed
                    ? styles.badgeCompletedText
                    : styles.badgeProgressText,
                ]}>
                {project.is_completed ? '✅ 완료' : '🧶 진행 중'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                project.visibility === 'public'
                  ? styles.badgePublic
                  : styles.badgePrivate,
              ]}>
              <Text
                style={[
                  styles.statusText,
                  project.visibility === 'public'
                    ? styles.badgePublicText
                    : styles.badgePrivateText,
                ]}>
                {project.visibility === 'public' ? '🌐 공개' : '🔒 비공개'}
              </Text>
            </View>
          </View>
        </View>

        {project.content ? (
          <View style={styles.section}>
            <Text style={styles.label}>프로젝트 설명</Text>
            <Text style={styles.body}>{project.content}</Text>
          </View>
        ) : null}

        {project.yarn_info ? (
          <View style={styles.section}>
            <Text style={styles.label}>실 정보</Text>
            <Text style={styles.body}>{project.yarn_info}</Text>
          </View>
        ) : null}

        {project.needle_info ? (
          <View style={styles.section}>
            <Text style={styles.label}>바늘 정보</Text>
            <Text style={styles.body}>{project.needle_info}</Text>
          </View>
        ) : null}

        {project.pattern_info ? (
          <View style={styles.section}>
            <Text style={styles.label}>도안 정보</Text>
            <Text style={styles.body}>{project.pattern_info}</Text>
          </View>
        ) : null}

        {project.pattern_url ? (
          <View style={styles.section}>
            <Text style={styles.label}>도안 링크</Text>
            <Text style={[styles.body, styles.link]}>
              {project.pattern_url}
            </Text>
          </View>
        ) : null}

        {/* 게시물 목록 */}
        <View style={styles.section}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.label}>게시물 ({posts.length})</Text>
            {isMyProject && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddPost}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={styles.addButtonText}>게시물 추가</Text>
              </TouchableOpacity>
            )}
          </View>

          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyText}>아직 게시물이 없어요</Text>
              {isMyProject && (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={handleAddPost}>
                  <Text style={styles.emptyAddButtonText}>
                    첫 게시물 추가하기
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            posts.map(post => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                onPress={() => handleGoToPost(post.id)}
                activeOpacity={0.8}>
                {post.post_images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageScroll}>
                    {post.post_images
                      .slice()
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(img => (
                        <Image
                          key={img.id}
                          source={{uri: img.image_url}}
                          style={styles.postImage}
                        />
                      ))}
                  </ScrollView>
                )}
                <Text style={styles.postContent}>{post.content}</Text>
                <Text style={styles.postDate}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 뜨개 로그 */}
        {project.knitting_logs && project.knitting_logs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>뜨개 로그</Text>
            {project.knitting_logs
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )
              .map(log => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logDate}>
                    {new Date(log.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.logContent}>{log.content}</Text>
                </View>
              ))}
          </View>
        )}

        {/* 완료하기 버튼 */}
        {isMyProject && !project.is_completed && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => setCompleteModalVisible(true)}>
            <Text style={styles.completeButtonText}>완료하기</Text>
          </TouchableOpacity>
        )}

        <View style={{height: 40}} />
      </ScrollView>

      {/* 액션시트 */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />
            <TouchableOpacity
              style={styles.actionSheetBtn}
              onPress={handleEditProject}>
              <Text style={styles.actionSheetIcon}>✏️</Text>
              <Text style={styles.actionSheetText}>수정하기</Text>
            </TouchableOpacity>
            <View style={styles.actionSheetDivider} />
            <TouchableOpacity
              style={styles.actionSheetBtn}
              onPress={handleDeleteProject}>
              <Text style={styles.actionSheetIcon}>🗑️</Text>
              <Text style={[styles.actionSheetText, styles.destructiveText]}>
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetBtn, styles.cancelBtn]}
              onPress={() => setShowActionSheet(false)}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <CompletePostModal
        visible={completeModalVisible}
        onClose={() => setCompleteModalVisible(false)}
        onConfirm={handleConfirmComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 12,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
  },
  badgeProgress: {
    backgroundColor: '#f0ecff',
  },
  badgeProgressText: {
    color: '#6b4fbb',
  },
  badgeCompleted: {
    backgroundColor: '#e8f5e9',
  },
  badgeCompletedText: {
    color: '#4CAF50',
  },
  badgePublic: {
    backgroundColor: '#e3f2fd',
  },
  badgePublicText: {
    color: '#1976D2',
  },
  badgePrivate: {
    backgroundColor: '#f5f5f5',
  },
  badgePrivateText: {
    color: '#999',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  link: {
    color: '#007AFF',
  },
  logItem: {
    marginBottom: 12,
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
  },
  logDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  logContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b4fbb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  emptyAddButton: {
    backgroundColor: '#6b4fbb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postCard: {
    marginBottom: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageScroll: {
    height: 200,
  },
  postImage: {
    width: 200,
    height: 200,
    marginRight: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    padding: 12,
    lineHeight: 20,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  completeButton: {
    margin: 20,
    backgroundColor: '#6b4fbb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  actionSheetBtn: {
    padding: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionSheetIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionSheetText: {
    fontSize: 17,
    color: '#000',
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  cancelBtn: {
    borderTopWidth: 8,
    borderTopColor: '#f5f5f5',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
