import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect,
} from 'react';
import {
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
  Linking,
  Switch,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

import {RouteProp, useRoute, useFocusEffect} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {ProjectDetail, SimplePost} from '@/@types/database';
import Icon from 'react-native-vector-icons/Feather';
import CompletePostModal from '@/components/modal/CompletePostModal';
import * as S from './ProjectDetailScreen.styles';

type RouteProps = RouteProp<
  {
    ProjectDetail: {
      projectId?: string;
      projectTitle?: string;
      mode?: 'view' | 'create';
    };
  },
  'ProjectDetail'
>;

// 저장 전 임시 로그
interface PendingLog {
  id: string; // 오늘 로그 수정이면 기존 id, 새 로그면 임시 id
  content: string;
  isExisting: boolean; // true → UPDATE, false → INSERT
}

function checkDirty(
  original: OriginalValues | null,
  current: CurrentForm,
): boolean {
  if (!original) return true;
  return (
    original.title !== current.title ||
    original.content !== current.content ||
    original.yarnInfo !== current.yarnInfo ||
    original.needleInfo !== current.needleInfo ||
    original.patternInfo !== current.patternInfo ||
    original.patternUrl !== current.patternUrl ||
    original.formIsCompleted !== current.formIsCompleted ||
    original.formVisibility !== current.formVisibility ||
    current.pendingLogs.some(l => l.content.trim() !== '')
  );
}

interface OriginalValues {
  title: string;
  content: string;
  yarnInfo: string;
  needleInfo: string;
  patternInfo: string;
  patternUrl: string;
  formIsCompleted: boolean;
  formVisibility: 'public' | 'private';
}

interface CurrentForm {
  title: string;
  content: string;
  yarnInfo: string;
  needleInfo: string;
  patternInfo: string;
  patternUrl: string;
  formIsCompleted: boolean;
  formVisibility: 'public' | 'private';
  pendingLogs: PendingLog[];
}

export default function ProjectDetailScreen() {
  const route = useRoute<RouteProps>();
  const {navigation} = useCommonNavigation<any>();
  const projectId = route.params?.projectId;
  const isCreateMode = route.params?.mode === 'create' || !projectId;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [posts, setPosts] = useState<SimplePost[]>([]);
  const [loading, setLoading] = useState(!isCreateMode);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingPatternUrl, setIsEditingPatternUrl] = useState(false);
  const hasFetchedRef = useRef(false);

  console.log('프로젝트', project);
  console.log('프로젝트 로딩', loading);
  // ── 폼 필드
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [yarnInfo, setYarnInfo] = useState('');
  const [needleInfo, setNeedleInfo] = useState('');
  const [patternInfo, setPatternInfo] = useState('');
  const [patternUrl, setPatternUrl] = useState('');
  const [formIsCompleted, setFormIsCompleted] = useState(false);
  const [formVisibility, setFormVisibility] = useState<'public' | 'private'>(
    'private',
  );

  // ── 뜨개 로그
  const [pendingLogs, setPendingLogs] = useState<PendingLog[]>([]);
  const [existingReadOnlyLogs, setExistingReadOnlyLogs] = useState<
    Array<{id: string; content: string; created_at: string}>
  >([]);

  // ── dirty 감지
  const originalRef = useRef<OriginalValues | null>(null);
  const [isDirty, setIsDirty] = useState(isCreateMode);

  const updateDirty = useCallback(
    (overrides: Partial<CurrentForm> = {}) => {
      const current: CurrentForm = {
        title,
        content,
        yarnInfo,
        needleInfo,
        patternInfo,
        patternUrl,
        formIsCompleted,
        formVisibility,
        pendingLogs,
        ...overrides,
      };
      setIsDirty(checkDirty(originalRef.current, current));
    },
    [
      title,
      content,
      yarnInfo,
      needleInfo,
      patternInfo,
      patternUrl,
      formIsCompleted,
      formVisibility,
      pendingLogs,
    ],
  );

  const setField = useCallback(
    <K extends keyof Omit<CurrentForm, 'pendingLogs'>>(
      key: K,
      value: Omit<CurrentForm, 'pendingLogs'>[K],
    ) => {
      const setters: Record<
        keyof Omit<CurrentForm, 'pendingLogs'>,
        (v: any) => void
      > = {
        title: setTitle,
        content: setContent,
        yarnInfo: setYarnInfo,
        needleInfo: setNeedleInfo,
        patternInfo: setPatternInfo,
        patternUrl: setPatternUrl,
        formIsCompleted: setFormIsCompleted,
        formVisibility: setFormVisibility,
      };
      setters[key](value);
      updateDirty({[key]: value});
    },
    [updateDirty],
  );

  // pendingLogs는 배열 내부 변경이 있어 별도 핸들러로 처리
  const updatePendingLog = useCallback(
    (id: string, text: string) => {
      const next = pendingLogs.map(l =>
        l.id === id ? {...l, content: text} : l,
      );
      setPendingLogs(next);
      updateDirty({pendingLogs: next});
    },
    [pendingLogs, updateDirty],
  );

  const addPendingLog = useCallback(() => {
    const next = [
      ...pendingLogs,
      {id: Date.now().toString(), content: '', isExisting: false},
    ];
    setPendingLogs(next);
    updateDirty({pendingLogs: next});
  }, [pendingLogs, updateDirty]);

  const removePendingLog = useCallback(
    (id: string) => {
      const next = pendingLogs.filter(l => l.id !== id);
      setPendingLogs(next);
      updateDirty({pendingLogs: next});
    },
    [pendingLogs, updateDirty],
  );

  // ── populateForm
  const populateForm = useCallback((p: ProjectDetail) => {
    const values: OriginalValues = {
      title: p.title || '',
      content: p.content || '',
      yarnInfo: p.yarn_info || '',
      needleInfo: p.needle_info || '',
      patternInfo: p.pattern_info || '',
      patternUrl: p.pattern_url || '',
      formIsCompleted: p.is_completed || false,
      formVisibility: p.visibility || 'private',
    };
    originalRef.current = values;
    setTitle(values.title);
    setContent(values.content);
    setYarnInfo(values.yarnInfo);
    setNeedleInfo(values.needleInfo);
    setPatternInfo(values.patternInfo);
    setPatternUrl(values.patternUrl);
    setFormIsCompleted(values.formIsCompleted);
    setFormVisibility(values.formVisibility);
    setIsDirty(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logs = p.knitting_logs || [];

    const todayLogs = logs.filter(log => {
      const d = new Date(log.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const todayLogIds = new Set(todayLogs.map(l => l.id));
    setExistingReadOnlyLogs(logs.filter(l => !todayLogIds.has(l.id)));
    setPendingLogs(
      todayLogs.map(l => ({id: l.id, content: l.content, isExisting: true})),
    );

    //url입력 완료 후 수정 모드 해제
    setIsEditingPatternUrl(false);
  }, []);

  // 오늘 로그가 이미 있는지 (pendingLogs 중 isExisting인 것)
  const hasTodayLog = pendingLogs.some(l => l.isExisting);

  // ── 헤더
  const handleSaveRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isCreateMode ? '프로젝트 생성' : project?.title ?? '',
    });

    if (isDirty) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => handleSaveRef.current()}
            disabled={isSubmitting}
            style={{paddingHorizontal: 4}}>
            <S.SubmitText>{isSubmitting ? '저장 중...' : '완료'}</S.SubmitText>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: undefined,
      });
    }
  }, [isDirty, isSubmitting, isCreateMode, project?.title, navigation]);

  // ── fetch
  const fetchData = useCallback(async () => {
    if (!hasFetchedRef.current) setLoading(true); // 최초만
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const {data: projectData, error: projectError} = await supabase
        .from('projects')
        .select(
          `id, user_id, title, content, yarn_info, needle_info,
           pattern_info, pattern_url, is_completed, visibility,
           created_at, updated_at,
           knitting_logs ( id, project_id, content, created_at )`,
        )
        .eq('id', projectId)
        .single();
      if (projectError) throw projectError;
      const p = projectData as ProjectDetail;
      setProject(p);
      populateForm(p);

      const {data: postsData, error: postsError} = await supabase
        .from('posts')
        .select(
          `id, user_id, project_id, content, created_at, updated_at,
           post_images ( id, post_id, image_url, display_order )`,
        )
        .eq('project_id', projectId)
        .order('created_at', {ascending: false});
      if (postsError) throw postsError;
      setPosts((postsData as SimplePost[]) || []);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('프로젝트 상세 조회 실패:', error);
      Alert.alert('오류', '프로젝트 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId, populateForm]);

  useFocusEffect(
    useCallback(() => {
      if (!isCreateMode && projectId) {
        fetchData();
      }
    }, [projectId, isCreateMode, fetchData]),
  );

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [projectId]);

  // ── 저장
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('알림', '프로젝트 제목을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('알림', '로그인이 필요합니다.');
        return;
      }

      let currentProjectId: string;

      if (isCreateMode) {
        const {data: newProject, error} = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: title.trim(),
            content: content.trim() || null,
            yarn_info: yarnInfo.trim() || null,
            needle_info: needleInfo.trim() || null,
            pattern_info: patternInfo.trim() || null,
            pattern_url: patternUrl.trim() || null,
            visibility: formVisibility,
          })
          .select()
          .single();
        if (error) throw new Error('프로젝트 생성에 실패했습니다.');
        currentProjectId = newProject.id;
      } else {
        const {error} = await supabase
          .from('projects')
          .update({
            title: title.trim(),
            content: content.trim() || null,
            yarn_info: yarnInfo.trim() || null,
            needle_info: needleInfo.trim() || null,
            pattern_info: patternInfo.trim() || null,
            pattern_url: patternUrl.trim() || null,
            is_completed: formIsCompleted,
            visibility: formVisibility,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId!);
        if (error) throw new Error('프로젝트 수정에 실패했습니다.');
        currentProjectId = projectId!;
      }

      // 로그 저장: isExisting이면 UPDATE, 아니면 INSERT
      for (const log of pendingLogs.filter(l => l.content.trim())) {
        if (log.isExisting) {
          await supabase
            .from('knitting_logs')
            .update({content: log.content.trim()})
            .eq('id', log.id);
        } else {
          await supabase.from('knitting_logs').insert({
            project_id: currentProjectId,
            content: log.content.trim(),
          });
        }
      }

      if (isCreateMode) {
        Alert.alert('성공', '프로젝트가 작성되었습니다!', [
          {
            text: '확인',
            onPress: () =>
              navigation.replace(PROJECTS_ROUTES.PROJECT_DETAIL, {
                projectId: currentProjectId,
                projectTitle: title.trim(),
              }),
          },
        ]);
      } else {
        await fetchData();
        Alert.alert('성공', '저장되었습니다.');
      }
    } catch (error) {
      console.error('프로젝트 저장 실패:', error);
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    content,
    yarnInfo,
    needleInfo,
    patternInfo,
    patternUrl,
    formIsCompleted,
    formVisibility,
    pendingLogs,
    isCreateMode,
    projectId,
    navigation,
    fetchData,
  ]);

  handleSaveRef.current = handleSave;

  // ── 삭제
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
                .eq('id', projectId!);
              if (error) throw error;
              Alert.alert('삭제 완료', '프로젝트가 삭제되었습니다.', [
                {text: '확인', onPress: () => navigation.goBack()},
              ]);
            } catch {
              Alert.alert('오류', '프로젝트 삭제에 실패했습니다.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  // ── 완료 처리
  const handleConfirmComplete = async (visibility: 'public' | 'private') => {
    if (!project) return;
    try {
      const {error} = await supabase
        .from('projects')
        .update({is_completed: true, visibility})
        .eq('id', projectId!);
      if (error) throw error;
      setProject({...project, is_completed: true, visibility});
      if (originalRef.current) {
        originalRef.current = {
          ...originalRef.current,
          formIsCompleted: true,
          formVisibility: visibility,
        };
      }
      setFormIsCompleted(true);
      setFormVisibility(visibility);
      setIsDirty(false);
      setCompleteModalVisible(false);
    } catch {
      Alert.alert('오류', '완료 처리에 실패했습니다.');
    }
  };

  const isMyProject = project?.user_id === currentUserId;
  const canEdit = isCreateMode || isMyProject;

  if (loading) {
    return (
      <S.Container>
        <ActivityIndicator size="large" color="#6b4fbb" />
      </S.Container>
    );
  }

  if (!isCreateMode && !project) {
    return (
      <S.Center>
        <S.EmptyText>프로젝트를 찾을 수 없어요.</S.EmptyText>
      </S.Center>
    );
  }

  return (
    <S.Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ══ SNS 스타일: 제목 + 설명 ══════════════════════ */}
        <S.PostArea>
          {canEdit ? (
            <S.TitleInput
              placeholder="프로젝트 이름을 입력해주세요"
              value={title}
              onChangeText={v => setField('title', v)}
              placeholderTextColor="#ccc"
              multiline
            />
          ) : (
            <S.Title>{project!.title}</S.Title>
          )}

          <S.PostAreaDivider />

          {canEdit ? (
            <S.DescriptionInput
              placeholder={
                '어떤 작품인지 자유롭게 설명해주세요\n\n색상, 분위기, 만들게 된 이유 등...'
              }
              value={content}
              onChangeText={v => setField('content', v)}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#bbb"
            />
          ) : project?.content ? (
            <S.Body>{project.content}</S.Body>
          ) : (
            <S.PlaceholderText>
              프로젝트에 대해 자유롭게 설명해주세요
            </S.PlaceholderText>
          )}

          {!isCreateMode && project && (
            <S.MetaRow>
              <S.Date>
                {new Date(project.created_at).toLocaleDateString('ko-KR')}
              </S.Date>
            </S.MetaRow>
          )}

          {isMyProject && (
            <S.ActionSheetTrigger onPress={() => setShowActionSheet(true)}>
              <Icon name="more-horizontal" size={20} color="#bbb" />
            </S.ActionSheetTrigger>
          )}
        </S.PostArea>

        {/* ══ 상태 설정 (내 프로젝트) ══════════════════════ */}
        {canEdit && !isCreateMode && (
          <S.MetaSection>
            {/* 뜨개 상태 – 배지 탭으로 전환 */}
            <S.MetaRow>
              <S.MetaRowLeft>
                <S.MetaRowTitle>뜨개 상태</S.MetaRowTitle>
                <S.MetaRowSub>탭해서 변경</S.MetaRowSub>
              </S.MetaRowLeft>
              <TouchableOpacity
                onPress={() => setField('formIsCompleted', !formIsCompleted)}
                activeOpacity={0.7}>
                <S.StatusBadge
                  variant={formIsCompleted ? 'completed' : 'progress'}>
                  <S.StatusText
                    variant={formIsCompleted ? 'completed' : 'progress'}>
                    {formIsCompleted ? '✅ 완료' : '🧶 진행 중'}
                  </S.StatusText>
                </S.StatusBadge>
              </TouchableOpacity>
            </S.MetaRow>

            {/* 게시물 공개 여부 – 토글 스위치 */}
            <S.MetaRow style={{borderBottomWidth: 0}}>
              <S.MetaRowLeft>
                <S.MetaRowTitle>게시물 공개</S.MetaRowTitle>
                <S.MetaRowSub>이 프로젝트의 게시물 공개 여부</S.MetaRowSub>
              </S.MetaRowLeft>
              <Switch
                value={formVisibility === 'public'}
                onValueChange={v =>
                  setField('formVisibility', v ? 'public' : 'private')
                }
                style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
              />
            </S.MetaRow>
          </S.MetaSection>
        )}

        {/* 조회 전용 배지 (타인 프로젝트) */}
        {!canEdit && project && (
          <S.MetaSection>
            <S.MetaRow style={{borderBottomWidth: 0}}>
              <S.BadgeRow>
                <S.StatusBadge
                  variant={project.is_completed ? 'completed' : 'progress'}>
                  <S.StatusText
                    variant={project.is_completed ? 'completed' : 'progress'}>
                    {project.is_completed ? '✅ 완료' : '🧶 진행 중'}
                  </S.StatusText>
                </S.StatusBadge>
                <S.StatusBadge
                  variant={
                    project.visibility === 'public' ? 'public' : 'private'
                  }>
                  <S.StatusText
                    variant={
                      project.visibility === 'public' ? 'public' : 'private'
                    }>
                    {project.visibility === 'public' ? '🌐 공개' : '🔒 비공개'}
                  </S.StatusText>
                </S.StatusBadge>
              </S.BadgeRow>
            </S.MetaRow>
          </S.MetaSection>
        )}

        {/* ══ 정보 섹션: 실 · 바늘 · 도안 ══════════════════ */}
        <S.InfoSection>
          <S.InfoRow>
            <S.InfoIconBox style={{backgroundColor: '#f3eeff'}}>
              <S.InfoIcon>🧶</S.InfoIcon>
            </S.InfoIconBox>
            <S.InfoContent>
              <S.InfoLabel>실</S.InfoLabel>
              {canEdit ? (
                <S.InfoInput
                  placeholder="브랜드, 색상, 두께 등"
                  value={yarnInfo}
                  onChangeText={v => setField('yarnInfo', v)}
                  placeholderTextColor="#ccc"
                  multiline
                />
              ) : project?.yarn_info ? (
                <S.InfoValue>{project.yarn_info}</S.InfoValue>
              ) : (
                <S.InfoPlaceholder>브랜드, 색상, 두께 등</S.InfoPlaceholder>
              )}
            </S.InfoContent>
          </S.InfoRow>

          <S.InfoRow>
            <S.InfoIconBox style={{backgroundColor: '#e8f5e9'}}>
              <S.InfoIcon>🪡</S.InfoIcon>
            </S.InfoIconBox>
            <S.InfoContent>
              <S.InfoLabel>바늘</S.InfoLabel>
              {canEdit ? (
                <S.InfoInput
                  placeholder="브랜드, 두께 등"
                  value={needleInfo}
                  onChangeText={v => setField('needleInfo', v)}
                  placeholderTextColor="#ccc"
                  multiline
                />
              ) : project?.needle_info ? (
                <S.InfoValue>{project.needle_info}</S.InfoValue>
              ) : (
                <S.InfoPlaceholder>브랜드, 두께 등</S.InfoPlaceholder>
              )}
            </S.InfoContent>
          </S.InfoRow>

          <S.InfoRow>
            <S.InfoIconBox style={{backgroundColor: '#fff3e0'}}>
              <S.InfoIcon>📄</S.InfoIcon>
            </S.InfoIconBox>
            <S.InfoContent>
              <S.InfoLabel>도안 설명</S.InfoLabel>
              {canEdit ? (
                <S.InfoInput
                  placeholder="사용한 도안에 대한 설명"
                  value={patternInfo}
                  onChangeText={v => setField('patternInfo', v)}
                  placeholderTextColor="#ccc"
                  multiline
                />
              ) : project?.pattern_info ? (
                <S.InfoValue>{project.pattern_info}</S.InfoValue>
              ) : (
                <S.InfoPlaceholder>사용한 도안에 대한 설명</S.InfoPlaceholder>
              )}
            </S.InfoContent>
          </S.InfoRow>

          <S.InfoRow style={{borderBottomWidth: 0}}>
            <S.InfoIconBox style={{backgroundColor: '#fff3e0'}}>
              <S.InfoIcon>🔗</S.InfoIcon>
            </S.InfoIconBox>
            <S.InfoContent>
              <S.InfoLabel>도안 링크</S.InfoLabel>
              {isEditingPatternUrl ? (
                <S.InfoInput
                  autoFocus
                  placeholder="https://..."
                  value={patternUrl}
                  onChangeText={v => setField('patternUrl', v)}
                  placeholderTextColor="#ccc"
                  autoCapitalize="none"
                  keyboardType="url"
                  onBlur={() => setIsEditingPatternUrl(false)}
                  multiline
                />
              ) : patternUrl ? (
                <S.LinkRow>
                  <S.Link
                    onPress={() => Linking.openURL(patternUrl)}
                    style={{flex: 1}}>
                    {patternUrl}
                  </S.Link>
                  {canEdit && (
                    <TouchableOpacity
                      onPress={() => setIsEditingPatternUrl(true)}>
                      <Icon name="edit-2" size={14} color="#bbb" />
                    </TouchableOpacity>
                  )}
                </S.LinkRow>
              ) : canEdit ? (
                <TouchableOpacity onPress={() => setIsEditingPatternUrl(true)}>
                  <S.InfoPlaceholder>https://...</S.InfoPlaceholder>
                </TouchableOpacity>
              ) : (
                <S.InfoPlaceholder>https://...</S.InfoPlaceholder>
              )}
            </S.InfoContent>
          </S.InfoRow>
        </S.InfoSection>

        {/* ══ 뜨개 로그 ════════════════════════════════════ */}
        <S.Section>
          <S.PostHeaderRow>
            <S.Label>뜨개 로그</S.Label>
            {canEdit && (
              <S.AddButton
                onPress={addPendingLog}
                disabled={hasTodayLog}
                style={{opacity: hasTodayLog ? 0.4 : 1}}>
                <Icon name="plus" size={16} color="#fff" />
                <S.AddButtonText>로그 추가</S.AddButtonText>
              </S.AddButton>
            )}
          </S.PostHeaderRow>

          {/* 기존 로그 – 읽기 전용 */}
          {existingReadOnlyLogs
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
            ))}

          {/* 편집 중인 로그 (오늘 로그 수정 + 새 로그들) */}
          {pendingLogs.map(log => (
            <S.LogEditItem key={log.id}>
              <S.LogEditHeader>
                <S.LogDate>
                  {log.isExisting ? '오늘 로그 수정 · ' : '새 로그 · '}
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </S.LogDate>
                {/* 새 로그만 삭제 가능 (오늘 로그 수정은 삭제 불가) */}
                {!log.isExisting && (
                  <TouchableOpacity onPress={() => removePendingLog(log.id)}>
                    <Icon name="x" size={14} color="#bbb" />
                  </TouchableOpacity>
                )}
              </S.LogEditHeader>
              <S.LogInput
                placeholder="오늘 뜬 내용을 기록해보세요..."
                value={log.content}
                onChangeText={text => updatePendingLog(log.id, text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#ccc"
              />
            </S.LogEditItem>
          ))}

          {!canEdit && existingReadOnlyLogs.length === 0 && (
            <S.PlaceholderText>아직 기록이 없어요</S.PlaceholderText>
          )}
        </S.Section>

        {/* ══ 게시물 ════════════════════════════════════ */}
        <S.Section>
          <S.PostHeaderRow>
            <S.Label>게시물 ({posts.length})</S.Label>
            {isMyProject && posts.length > 0 && (
              <S.AddButton
                onPress={() =>
                  navigation.navigate(PROJECTS_ROUTES.CREATE_POST_FOR_PROJECT, {
                    projectId,
                    projectTitle: project?.title,
                  })
                }>
                <Icon name="plus" size={16} color="#fff" />
                <S.AddButtonText>게시물 추가</S.AddButtonText>
              </S.AddButton>
            )}
          </S.PostHeaderRow>

          {isCreateMode ? (
            <S.EmptyPosts>
              <S.EmptyText>프로젝트 저장 후 추가할 수 있어요</S.EmptyText>
            </S.EmptyPosts>
          ) : posts.length === 0 ? (
            <S.EmptyPosts>
              <S.EmptyText>아직 게시물이 없어요</S.EmptyText>
              {isMyProject && (
                <S.EmptyAddButton
                  onPress={() =>
                    navigation.navigate(
                      PROJECTS_ROUTES.CREATE_POST_FOR_PROJECT,
                      {
                        projectId,
                        projectTitle: project?.title,
                      },
                    )
                  }>
                  <S.EmptyAddButtonText>
                    첫 게시물 추가하기
                  </S.EmptyAddButtonText>
                </S.EmptyAddButton>
              )}
            </S.EmptyPosts>
          ) : (
            posts.map(post => (
              <S.PostCard key={post.id}>
                {post.post_images.length > 0 && (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={SCREEN_WIDTH - 36}
                    decelerationRate="fast"
                    style={{height: 220}}>
                    {post.post_images
                      .slice()
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((img, index) => (
                        <S.PostImageWrapper
                          key={img.id}
                          width={SCREEN_WIDTH - 36}>
                          <S.PostImage source={{uri: img.image_url}} />
                          {post.post_images.length > 1 && (
                            <S.PostImageCounter>
                              {index + 1} / {post.post_images.length}
                            </S.PostImageCounter>
                          )}
                        </S.PostImageWrapper>
                      ))}
                  </ScrollView>
                )}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(POST_ROUTES.POST_DETAIL, {
                      postId: post.id,
                    })
                  }
                  activeOpacity={0.5}>
                  <S.PostContent>{post.content}</S.PostContent>
                  <S.PostDate>
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </S.PostDate>
                </TouchableOpacity>
              </S.PostCard>
            ))
          )}
        </S.Section>

        {/* ══ 완료하기 ════════════════════════════════════ */}
        {isMyProject && !project?.is_completed && !isDirty && (
          <S.CompleteButton onPress={() => setCompleteModalVisible(true)}>
            <S.CompleteButtonText>완료하기</S.CompleteButtonText>
          </S.CompleteButton>
        )}

        <View style={{height: 40}} />
      </ScrollView>

      {!isCreateMode && (
        <Modal
          visible={showActionSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setShowActionSheet(false)}>
          <S.Overlay
            activeOpacity={1}
            onPress={() => setShowActionSheet(false)}>
            <S.ActionSheet>
              <S.ActionSheetHandle />
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
      )}

      {!isCreateMode && (
        <CompletePostModal
          visible={completeModalVisible}
          onClose={() => setCompleteModalVisible(false)}
          onConfirm={handleConfirmComplete}
          initialVisibility={project?.visibility || 'private'}
        />
      )}
    </S.Container>
  );
}
