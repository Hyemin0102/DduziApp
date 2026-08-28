import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect,
} from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  View,
  Dimensions,
  Linking,
  Switch,
  Modal,
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
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import CalendarModal from '@/components/modal/CalendarModal';
import * as S from './ProjectDetailScreen.styles';
import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import DocumentPicker from 'react-native-document-picker';
import {
  uploadPdf,
  getPdfNameFromUrl,
  removePdf,
  MAX_PDF_SIZE_BYTES,
} from '@/lib/uploadPdf';
import {thumbnailUrl as toThumbnailUrl} from '@/lib/imageTransform';
import {uploadImage} from '@/lib/uploadImage';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import {trackEvent} from '@/lib/mixpanel';

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
  id: string;
  content: string;
  created_at?: string;
  isExisting: boolean;
  isEditable: boolean;
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
    original.thumbnailUrl !== current.thumbnailUrl ||
    original.startedAt !== current.startedAt ||
    original.completedAt !== current.completedAt ||
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
  thumbnailUrl: string;
  startedAt: string;
  completedAt: string;
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
  thumbnailUrl: string;
  startedAt: string;
  completedAt: string;
  pendingLogs: PendingLog[];
}

function PostContentPreview({content}: {content: string}) {
  const [isTruncated, setIsTruncated] = useState(false);
  return (
    <>
      <S.PostContent numberOfLines={2}>{content}</S.PostContent>
      <S.PostContent
        style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}}
        onTextLayout={e => setIsTruncated(e.nativeEvent.lines.length > 2)}>
        {content}
      </S.PostContent>
      {isTruncated && <S.PostMore>더보기</S.PostMore>}
    </>
  );
}

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return (
    <S.InfoValue>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <S.Link key={i} onPress={() => Linking.openURL(part)}>
            {part}
          </S.Link>
        ) : (
          part
        ),
      )}
    </S.InfoValue>
  );
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
  const [pdfInfoVisible, setPdfInfoVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPdf, setPendingPdf] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [patternPdfName, setPatternPdfName] = useState('');
  const [isEditingPatternInfo, setIsEditingPatternInfo] = useState(false);
  const [isEditingYarnInfo, setIsEditingYarnInfo] = useState(false);
  const [isEditingNeedleInfo, setIsEditingNeedleInfo] = useState(false);
  const hasFetchedRef = useRef(false);
  const viewTrackedRef = useRef(false);
  const [focusedLogId, setFocusedLogId] = useState<string | null>(null);
  const [logInputHeights, setLogInputHeights] = useState<
    Record<string, number>
  >({});

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
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [startedAt, setStartedAt] = useState('');
  console.log('시작일',startedAt);
  
  const [completedAt, setCompletedAt] = useState('');
  const [pendingThumbnail, setPendingThumbnail] = useState<string | null>(null);

  // ── 캘린더 / 썸네일 UI 상태
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');
  const [calendarTarget, setCalendarTarget] = useState<'started' | 'completed'>('started');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showThumbnailSheet, setShowThumbnailSheet] = useState(false);
  const [showPostImagePicker, setShowPostImagePicker] = useState(false);

  const MAX_LENGTH_LOG = 5;
  const MAX_LENGTH_POST = 3;

  // ── 뜨개 로그
  const [pendingLogs, setPendingLogs] = useState<PendingLog[]>([]);
  const [existingReadOnlyLogs, setExistingReadOnlyLogs] = useState<
    Array<{id: string; content: string; created_at: string}>
  >([]);

  // ── dirty 감지
  const originalRef = useRef<OriginalValues | null>(null);
  const [isDirty, setIsDirty] = useState(isCreateMode);
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

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
        thumbnailUrl,
        startedAt,
        completedAt,
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
      thumbnailUrl,
      startedAt,
      completedAt,
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
        thumbnailUrl: setThumbnailUrl,
        startedAt: setStartedAt,
        completedAt: setCompletedAt,
      };
      setters[key](value);
      updateDirty({[key]: value});
    },
    [updateDirty],
  );

  // 로그 내용 수정 — 디바운스로 자동 UPDATE
  const updatePendingLog = useCallback((id: string, text: string) => {
    setPendingLogs(prev =>
      prev.map(l => (l.id === id ? {...l, content: text} : l)),
    );
  }, []);

  const addPendingLog = useCallback(() => {
    const tempId = Date.now().toString();
    setPendingLogs(prev => [
      {id: tempId, content: '', isExisting: false, isEditable: true},
      ...prev,
    ]);
    trackEvent('knitting_log_added', {project_id: projectId});
  }, [projectId]);

  const handleAddPostPress = useCallback(() => {
    trackEvent('post_create_started', {
      source: 'project_detail',
      project_id: projectId,
    });
    navigation.navigate(POST_ROUTES.CREATE_POST_FOR_PROJECT, {
      projectId,
      projectTitle: project?.title,
    });
  }, [navigation, projectId, project?.title]);

  const removePendingLog = useCallback((log: PendingLog) => {
    Alert.alert('로그 삭제', '이 로그를 삭제할까요?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          // 낙관적 업데이트
          setPendingLogs(prev => prev.filter(l => l.id !== log.id));

          if (log.isExisting) {
            const {error} = await supabase
              .from('knitting_logs')
              .delete()
              .eq('id', log.id);

            if (error) {
              // 실패 시 롤백
              setPendingLogs(prev => [log, ...prev]);
              Alert.alert('오류', '로그 삭제에 실패했습니다.');
            }
          }
        },
      },
    ]);
  }, []);

  useEffect(() => {
    const newLogs = pendingLogs.filter(
      l => l.isEditable && !l.isExisting && l.content.trim(),
    );
    const existingLogs = pendingLogs.filter(
      l => l.isEditable && l.isExisting && l.content.trim(),
    );
    if (!newLogs.length && !existingLogs.length) return;

    const timer = setTimeout(async () => {
      // 새 로그 INSERT
      if (newLogs.length && projectId) {
        await Promise.all(
          newLogs.map(async l => {
            const {data, error} = await supabase
              .from('knitting_logs')
              .insert({project_id: projectId, content: l.content.trim()})
              .select('id')
              .single();
            if (!error && data) {
              // 임시 ID를 실제 UUID로 교체
              setPendingLogs(prev =>
                prev.map(p =>
                  p.id === l.id ? {...p, id: data.id, isExisting: true} : p,
                ),
              );
            }
          }),
        );
      }
      // 기존 로그 UPDATE
      if (existingLogs.length) {
        await Promise.all(
          existingLogs.map(l =>
            supabase
              .from('knitting_logs')
              .update({content: l.content.trim()})
              .eq('id', l.id),
          ),
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pendingLogs, projectId]);

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
      thumbnailUrl: p.thumbnail_url || '',
      startedAt: p.started_at || '',
      completedAt: p.completed_at || '',
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
    setThumbnailUrl(values.thumbnailUrl);
    setStartedAt(values.startedAt);
    setCompletedAt(values.completedAt);
    setPatternPdfName(p.pattern_pdf_name || '');
    setPendingPdf(null);
    setPendingThumbnail(null);
    setIsDirty(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logs = p.knitting_logs || [];

    const unified: PendingLog[] = logs
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map(l => {
        const d = new Date(l.created_at);
        d.setHours(0, 0, 0, 0);
        const isToday = d.getTime() === today.getTime();
        return {
          id: l.id,
          content: l.content,
          created_at: l.created_at,
          isExisting: true,
          isEditable: isToday, // 오늘만 편집 가능
        };
      });

    setPendingLogs(unified);
  }, []);

  // 오늘 로그가 이미 있는지 (pendingLogs 중 isExisting인 것)
  const hasTodayLog = pendingLogs.some(l => l.isEditable);

  // ── 헤더
  const handleSaveRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
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

  // ── 현재 로그인 유저 id (생성/수정 모드 공통)
  useEffect(() => {
    supabase.auth.getUser().then(({data: {user}}) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // ── fetch
  const fetchData = useCallback(async () => {
    if (!hasFetchedRef.current) setLoading(true); // 최초만
    try {
      const {data: projectData, error: projectError} = await supabase
        .from('projects')
        .select(
          `id, user_id, title, content, yarn_info, needle_info,
           pattern_info, pattern_url, pattern_pdf_name, is_completed, visibility,
           thumbnail_url, started_at, completed_at,
           created_at, updated_at,
           knitting_logs ( id, project_id, content, created_at )`,
        )
        .eq('id', projectId)
        .single();
      if (projectError) throw projectError;
      const p = projectData as ProjectDetail;
      setProject(p);
      // 저장하지 않은 변경사항이 있으면 폼은 덮어쓰지 않음 (다른 화면 다녀온 뒤 입력 유지)
      if (!isDirtyRef.current) {
        populateForm(p);
      }

      if (!viewTrackedRef.current) {
        viewTrackedRef.current = true;
        trackEvent('project_viewed', {
          project_id: p.id,
          owner_id: p.user_id,
          is_own_content: p.user_id === currentUserId,
        });
      }

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
    viewTrackedRef.current = false;
  }, [projectId]);

  // ── 저장
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('알림', '프로젝트 제목을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const finalCompletedAt = formIsCompleted ? (completedAt || todayStr) : null;
      const finalStartedAt = startedAt || todayStr;

      // 썸네일 업로드
      let finalThumbnailUrl = thumbnailUrl;
      if (pendingThumbnail) {
        const uploaded = await uploadImage(
          pendingThumbnail,
          'post-images',
          `project-thumbnails/${currentUserId}`,
        );
        if (uploaded) finalThumbnailUrl = uploaded;
        setPendingThumbnail(null);
      }

      // pendingPdf가 있으면 저장 시점에 업로드
      const didUploadPdf = Boolean(pendingPdf);
      let finalPatternUrl = patternUrl;
      let finalPatternPdfName = patternPdfName;
      if (pendingPdf) {
        const url = await uploadPdf(
          pendingPdf.uri,
          currentUserId || 'unknown',
          pendingPdf.name,
        );
        if (!url) throw new Error('PDF 업로드에 실패했습니다.');
        finalPatternUrl = url;
        finalPatternPdfName = pendingPdf.name;
        setPendingPdf(null);
        setPatternPdfName(pendingPdf.name);
        setField('patternUrl', url);
      } else if (!patternUrl) {
        // X로 삭제한 경우 이름도 함께 제거
        finalPatternPdfName = '';
      }

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
            pattern_url: finalPatternUrl.trim() || null,
            pattern_pdf_name: finalPatternPdfName.trim() || null,
            is_completed: formIsCompleted,
            visibility: formVisibility,
            thumbnail_url: finalThumbnailUrl || null,
            started_at: finalStartedAt,
            completed_at: finalCompletedAt,
          })
          .select()
          .single();
        if (error) throw new Error('프로젝트 생성에 실패했습니다.');
        currentProjectId = newProject.id;
        trackEvent('project_created', {project_id: currentProjectId});
      } else {
        const {error} = await supabase
          .from('projects')
          .update({
            title: title.trim(),
            content: content.trim() || null,
            yarn_info: yarnInfo.trim() || null,
            needle_info: needleInfo.trim() || null,
            pattern_info: patternInfo.trim() || null,
            pattern_url: finalPatternUrl.trim() || null,
            pattern_pdf_name: finalPatternPdfName.trim() || null,
            is_completed: formIsCompleted,
            visibility: formVisibility,
            thumbnail_url: finalThumbnailUrl || null,
            started_at: finalStartedAt,
            completed_at: finalCompletedAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId!);
        if (error) throw new Error('프로젝트 수정에 실패했습니다.');
        currentProjectId = projectId!;
        if (!project?.is_completed && formIsCompleted) {
          trackEvent('project_completed', {project_id: currentProjectId});
        }
      }

      if (didUploadPdf) {
        trackEvent('pattern_pdf_uploaded', {project_id: currentProjectId});
      }

      // 기존에 저장돼있던 PDF가 교체/제거됐으면 버킷에 남은 이전 파일 삭제
      const previousPatternUrl = originalRef.current?.patternUrl;
      if (previousPatternUrl && previousPatternUrl !== finalPatternUrl) {
        removePdf(previousPatternUrl);
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
        Alert.alert('성공', '저장되었습니다.', [
          {text: '확인', onPress: () => navigation.goBack()},
        ]);
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
    patternPdfName,
    pendingPdf,
    pendingThumbnail,
    thumbnailUrl,
    startedAt,
    completedAt,
    currentUserId,
    formIsCompleted,
    formVisibility,
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
      Alert.alert(
        '완료',
        visibility === 'public'
          ? '프로젝트가 공개로 완료되었습니다.'
          : '프로젝트가 비공개로 완료되었습니다.',
        [{text: '확인', onPress: () => navigation.goBack()}],
      );
    } catch {
      Alert.alert('오류', '완료 처리에 실패했습니다.');
    }
  };

  const isMyProject = project?.user_id === currentUserId;

  //내 프로젝트거나 생성 모드일때
  const canEdit = isCreateMode || isMyProject;

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.pdf,
        copyTo: 'cachesDirectory',
      });

      if (!result.uri) return;
      if (result.size && result.size > MAX_PDF_SIZE_BYTES) {
        Alert.alert('알림', 'PDF 파일은 20MB 이하만 업로드할 수 있어요.');
        return;
      }
      // 안드로이드의 content:// URI는 fetch()로 못 읽어서(status 0 에러) cachesDirectory로
      // 복사된 file:// 경로(fileCopyUri)를 사용
      const fileUri = result.fileCopyUri ?? result.uri;
      setPendingPdf({uri: fileUri, name: result.name ?? 'document.pdf'});
      setIsDirty(true);
    } catch (e: any) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert('오류', 'PDF 파일을 선택하는 중 오류가 발생했어요.');
      }
    }
  };

  const handleRemovePdf = () => {
    setPendingPdf(null);
    setField('patternUrl', '');
  };

  // ── 썸네일 핸들러
  const handlePickThumbnailFromGallery = async () => {
    setShowThumbnailSheet(false);
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    if (result.assets?.[0]?.uri) {
      setPendingThumbnail(result.assets[0].uri);
      updateDirty({thumbnailUrl: result.assets[0].uri});
      setIsDirty(true);
    }
  };

  const handlePickThumbnailFromCamera = async () => {
    setShowThumbnailSheet(false);
    const result = await launchCamera({mediaType: 'photo', quality: 0.8});
    if (result.assets?.[0]?.uri) {
      setPendingThumbnail(result.assets[0].uri);
      setIsDirty(true);
    }
  };

  const handlePickThumbnailFromPost = (imageUrl: string) => {
    setShowPostImagePicker(false);
    setThumbnailUrl(imageUrl);
    setPendingThumbnail(null);
    updateDirty({thumbnailUrl: imageUrl});
  };

  // ── 캘린더 핸들러
  const openCalendar = (target: 'started' | 'completed') => {
    setCalendarTarget(target);
    setCalendarMode(formIsCompleted ? 'range' : 'single');
    setShowCalendar(true);
  };

  const handleCalendarConfirm = ({
    date,
    startDate,
    endDate,
  }: {
    date?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setShowCalendar(false);
    if (calendarMode === 'single') {
      setField('startedAt', date ?? '');
    } else {
      setField('startedAt', startDate ?? '');
      setField('completedAt', endDate ?? '');
    }
  };

  // 날짜 표시 포맷
  const formatDateDisplay = (d: string, fallback = '날짜 선택') => {
    if (!d) return fallback;
    const [y, m, day] = d.split('-');
    return `${y}.${parseInt(m)}.${parseInt(day)}`;
  };

  const todayDisplay = (() => {
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  })();

  // 게시물 이미지 목록 (썸네일 선택용)
  const allPostImages = posts.flatMap(p =>
    p.post_images.map(img => img.image_url),
  );

  if (loading) {
    return (
      <S.Container>
        <ActivityIndicator
          size="large"
          color="#191919"
          style={{marginTop: 20}}
        />
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
      {isSubmitting && (
        <S.LoadingOverlay>
          <ActivityIndicator size="large" color="#ffffff" />
        </S.LoadingOverlay>
      )}
      <KeyboardAvoid>
        {/* ══ SNS 스타일: 제목 + 설명 ══════════════════════ */}
        <S.PostArea>
          <S.TitleWithThumbnailRow>
            {(canEdit || thumbnailUrl || pendingThumbnail) && (
              <S.ThumbnailWrapper
                onPress={canEdit ? () => setShowThumbnailSheet(true) : undefined}
                activeOpacity={canEdit ? 0.7 : 1}
                disabled={!canEdit}>
                {pendingThumbnail ? (
                  <S.ThumbnailImage source={{uri: pendingThumbnail}} />
                ) : thumbnailUrl ? (
                  <S.ThumbnailImage source={{uri: thumbnailUrl}} />
                ) : (
                  <S.ThumbnailPlaceholder>
                    <Icon name="camera" size={20} color="#ccc" />
                  </S.ThumbnailPlaceholder>
                )}
                {canEdit && (thumbnailUrl || pendingThumbnail) && (
                  <S.ThumbnailEditBadge>
                    <Icon name="camera" size={10} color="#fff" />
                  </S.ThumbnailEditBadge>
                )}
              </S.ThumbnailWrapper>
            )}
            <View style={{flex: 1}}>
              {canEdit ? (
                <S.TitleInputFlex
                  placeholder="프로젝트 이름을 입력해주세요"
                  value={title}
                  onChangeText={v => setField('title', v)}
                  placeholderTextColor="#ccc"
                  multiline
                  maxLength={20}
                />
              ) : (
                <S.TitleFlex>{project!.title}</S.TitleFlex>
              )}
            </View>
          </S.TitleWithThumbnailRow>

          <S.PostAreaDivider />

          {canEdit ? (
            <S.DescriptionInput
              placeholder={'어떤 작품인지 자유롭게 설명해주세요'}
              value={content}
              onChangeText={v => setField('content', v)}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#bbb"
              maxLength={2000}
            />
          ) : project?.content ? (
            <S.Body>{project.content}</S.Body>
          ) : null}

          {/* {!isCreateMode && project && (
            <S.MetaRow>
              <S.Date>
                {new Date(project.created_at).toLocaleDateString('ko-KR')}
              </S.Date>
            </S.MetaRow>
          )} */}

          {isMyProject && (
            <S.ActionSheetTrigger onPress={() => setShowActionSheet(true)}>
              <Icon name="more-horizontal" size={20} color="#bbb" />
            </S.ActionSheetTrigger>
          )}
        </S.PostArea>

        {/* ══ 상태 설정 (내 프로젝트) ══════════════════════ */}
        {canEdit && (
          <S.MetaSection>
            {/* 뜨개 상태 – 세그먼트 컨트롤 + 날짜 */}
            <S.MetaRow style={{alignItems: 'flex-start', paddingBottom: 14}}>
              <S.MetaRowLeft>
                <S.MetaRowTitle style={{paddingTop: 6}}>뜨개 상태</S.MetaRowTitle>
              </S.MetaRowLeft>
              <View style={{alignItems: 'flex-end', gap: 10}}>
                <S.StatusSegment>
                  <S.StatusSegmentButton
                    active={!formIsCompleted}
                    onPress={() => {
                      if (formIsCompleted) {
                        setField('formIsCompleted', false);
                      }
                    }}>
                    <S.StatusSegmentText active={!formIsCompleted}>
                      진행 중
                    </S.StatusSegmentText>
                  </S.StatusSegmentButton>
                  <S.StatusSegmentButton
                    active={formIsCompleted}
                    onPress={() => {
                      if (!formIsCompleted) setField('formIsCompleted', true);
                    }}>
                    <S.StatusSegmentText active={formIsCompleted}>
                      완료
                    </S.StatusSegmentText>
                  </S.StatusSegmentButton>
                </S.StatusSegment>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  {formIsCompleted ? (
                    <>
                      <S.DateChip onPress={() => openCalendar('started')}>
                        <Icon name="calendar" size={12} color="#888" />
                        <S.DateChipText>{startedAt ? formatDateDisplay(startedAt) : todayDisplay}</S.DateChipText>
                      </S.DateChip>
                      <S.DateRangeSep>~</S.DateRangeSep>
                      <S.DateChip onPress={() => openCalendar('completed')}>
                        <Icon name="calendar" size={12} color="#888" />
                        <S.DateChipText>{formatDateDisplay(completedAt, '종료일')}</S.DateChipText>
                      </S.DateChip>
                    </>
                  ) : (
                    <S.DateChip onPress={() => openCalendar('started')}>
                      <Icon name="calendar" size={12} color="#888" />
                      <S.DateChipText>{startedAt ? formatDateDisplay(startedAt) : todayDisplay}</S.DateChipText>
                    </S.DateChip>
                  )}
                </View>
              </View>
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
          <S.InfoHeaderRow>
            <S.Label>뜨개 정보</S.Label>
          </S.InfoHeaderRow>
          <S.InfoRow>
            <S.InfoIconBox style={{backgroundColor: '#f3eeff'}}>
              <S.InfoIcon>🧶</S.InfoIcon>
            </S.InfoIconBox>
            <S.InfoContent>
              <S.InfoLabel>실</S.InfoLabel>
              {isEditingYarnInfo ? (
                <S.InfoInput
                  autoFocus
                  placeholder="어떤 실을 사용하셨나요?"
                  value={yarnInfo}
                  onChangeText={v => setField('yarnInfo', v)}
                  placeholderTextColor="#ccc"
                  multiline
                  onBlur={() => setIsEditingYarnInfo(false)}
                  maxLength={200}
                />
              ) : yarnInfo ? (
                <S.LinkRow>
                  <S.InfoValue style={{flex: 1}}>{yarnInfo}</S.InfoValue>
                  {canEdit && (
                    <TouchableOpacity
                      onPress={() => setIsEditingYarnInfo(true)}>
                      <Icon name="edit-2" size={14} color="#bbb" />
                    </TouchableOpacity>
                  )}
                </S.LinkRow>
              ) : canEdit ? (
                <TouchableOpacity onPress={() => setIsEditingYarnInfo(true)}>
                  <S.InfoPlaceholder>어떤 실을 사용하셨나요?</S.InfoPlaceholder>
                </TouchableOpacity>
              ) : null}
            </S.InfoContent>
          </S.InfoRow>

          <S.InfoRow>
            <S.InfoIconBox style={{backgroundColor: '#e8f5e9'}}>
              <S.InfoIcon>🪡</S.InfoIcon>
            </S.InfoIconBox>
            <S.InfoContent>
              <S.InfoLabel>바늘</S.InfoLabel>
              {isEditingNeedleInfo ? (
                <S.InfoInput
                  autoFocus
                  placeholder="어떤 바늘을 사용하셨나요?"
                  value={needleInfo}
                  onChangeText={v => setField('needleInfo', v)}
                  placeholderTextColor="#ccc"
                  multiline
                  onBlur={() => setIsEditingNeedleInfo(false)}
                  maxLength={200}
                />
              ) : needleInfo ? (
                <S.LinkRow>
                  <S.InfoValue style={{flex: 1}}>{needleInfo}</S.InfoValue>
                  {canEdit && (
                    <TouchableOpacity
                      onPress={() => setIsEditingNeedleInfo(true)}>
                      <Icon name="edit-2" size={14} color="#bbb" />
                    </TouchableOpacity>
                  )}
                </S.LinkRow>
              ) : canEdit ? (
                <TouchableOpacity onPress={() => setIsEditingNeedleInfo(true)}>
                  <S.InfoPlaceholder>
                    어떤 바늘을 사용하셨나요?
                  </S.InfoPlaceholder>
                </TouchableOpacity>
              ) : null}
            </S.InfoContent>
          </S.InfoRow>

          <S.InfoRow>
            <S.InfoIconBox style={{backgroundColor: '#fff3e0'}}>
              <S.InfoIcon>📄</S.InfoIcon>
            </S.InfoIconBox>
            <S.InfoContent>
              <S.InfoLabel>도안</S.InfoLabel>
              {isEditingPatternInfo ? (
                <S.InfoInput
                  autoFocus
                  placeholder="어떤 도안을 참고하셨나요?"
                  value={patternInfo}
                  onChangeText={v => setField('patternInfo', v)}
                  placeholderTextColor="#ccc"
                  multiline
                  onBlur={() => setIsEditingPatternInfo(false)}
                  maxLength={1000}
                />
              ) : patternInfo ? (
                <S.LinkRow>
                  <View style={{flex: 1}}>
                    {renderTextWithLinks(patternInfo)}
                  </View>
                  {canEdit && (
                    <TouchableOpacity
                      onPress={() => setIsEditingPatternInfo(true)}>
                      <Icon name="edit-2" size={14} color="#bbb" />
                    </TouchableOpacity>
                  )}
                </S.LinkRow>
              ) : canEdit ? (
                <TouchableOpacity onPress={() => setIsEditingPatternInfo(true)}>
                  <S.InfoPlaceholder>
                    어떤 도안을 참고하셨나요?
                  </S.InfoPlaceholder>
                </TouchableOpacity>
              ) : null}
            </S.InfoContent>
          </S.InfoRow>

          {(isMyProject || isCreateMode) && (
            <S.InfoRow style={{borderBottomWidth: 0}}>
              <S.InfoIconBox style={{backgroundColor: '#f1f1ef'}}>
                <S.InfoIcon>📎</S.InfoIcon>
              </S.InfoIconBox>
              <S.InfoContent>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <S.InfoLabel>도안 PDF</S.InfoLabel>
                  <TouchableOpacity onPress={() => setPdfInfoVisible(true)}>
                    <Icon
                      name="info"
                      size={14}
                      color="#555"
                      style={{marginBottom: 3}}
                    />
                  </TouchableOpacity>
                </View>
                {pendingPdf ? (
                  <S.LinkRow>
                    <S.Link
                      style={{flex: 1}}
                      onPress={() =>
                        navigation.navigate(PROJECTS_ROUTES.PDF_VIEWER, {
                          pdfUrl: pendingPdf.uri,
                          title: pendingPdf.name,
                        })
                      }>
                      {pendingPdf.name}
                    </S.Link>
                    <TouchableOpacity onPress={handleRemovePdf}>
                      <Icon name="x" size={16} color="#bbb" />
                    </TouchableOpacity>
                  </S.LinkRow>
                ) : patternUrl ? (
                  <S.LinkRow>
                    <S.Link
                      style={{flex: 1}}
                      onPress={() =>
                        navigation.navigate(PROJECTS_ROUTES.PDF_VIEWER, {
                          pdfPath: patternUrl,
                          title:
                            patternPdfName || getPdfNameFromUrl(patternUrl),
                        })
                      }>
                      {patternPdfName || getPdfNameFromUrl(patternUrl)}
                    </S.Link>
                    <TouchableOpacity onPress={handleRemovePdf}>
                      <Icon name="x" size={16} color="#bbb" />
                    </TouchableOpacity>
                  </S.LinkRow>
                ) : (
                  <TouchableOpacity onPress={handlePickPdf}>
                    <S.InfoPlaceholder>PDF 파일 선택</S.InfoPlaceholder>
                  </TouchableOpacity>
                )}
              </S.InfoContent>
            </S.InfoRow>
          )}
        </S.InfoSection>

        {/* ══ 뜨개 로그 ════════════════════════════════════ */}
        <S.Section>
          <S.PostHeaderRow>
            <S.Label>
              뜨개 로그({isCreateMode ? 0 : pendingLogs.length})
            </S.Label>
            {canEdit && !isCreateMode && pendingLogs.length > 0 && (
              <S.AddButton
                onPress={addPendingLog}
                disabled={hasTodayLog}
                style={{opacity: hasTodayLog ? 0.4 : 1}}>
                <Icon name="plus" size={16} color="#fff" />
                <S.AddButtonText>로그 추가</S.AddButtonText>
              </S.AddButton>
            )}
          </S.PostHeaderRow>

          {isCreateMode ? (
            <S.EmptyPosts>
              <S.EmptyText>프로젝트 저장 후 추가할 수 있어요</S.EmptyText>
            </S.EmptyPosts>
          ) : pendingLogs.length === 0 ? (
            <S.EmptyPosts>
              <S.EmptyText>아직 기록이 없어요</S.EmptyText>
              {canEdit && (
                <S.EmptyAddButton onPress={addPendingLog}>
                  <S.EmptyAddButtonText>첫 로그 추가하기</S.EmptyAddButtonText>
                </S.EmptyAddButton>
              )}
            </S.EmptyPosts>
          ) : (
            <>
              {pendingLogs.slice(0, MAX_LENGTH_LOG).map((log, index) => {
                const isLast =
                  index === Math.min(pendingLogs.length, MAX_LENGTH_LOG) - 1 &&
                  pendingLogs.length <= MAX_LENGTH_LOG;
                return (
                  <S.LogTimelineRow key={log.id}>
                    <S.LogTimelineDotCol>
                      <S.LogTimelineDot active={log.isEditable} />
                      {!isLast && <S.LogTimelineLine />}
                    </S.LogTimelineDotCol>
                    <S.LogTimelineContent>
                      <S.LogTimelineDateRow>
                        <S.LogTimelineDate active={log.isEditable}>
                          {log.isEditable
                            ? `오늘 · ${new Date().toLocaleDateString('ko-KR', {
                                month: 'long',
                                day: 'numeric',
                              })}`
                            : new Date(log.created_at!).toLocaleDateString(
                                'ko-KR',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                },
                              )}
                        </S.LogTimelineDate>
                        {canEdit && log.isEditable && (
                          <TouchableOpacity
                            onPress={() => removePendingLog(log)}>
                            <Icon name="x" size={14} color="#bbb" />
                          </TouchableOpacity>
                        )}
                      </S.LogTimelineDateRow>
                      {log.isEditable && isMyProject ? (
                        <S.LogInputWrapper isFocused={focusedLogId === log.id}>
                          <S.LogInput
                            placeholder="오늘 뜬 내용을 기록해보세요"
                            value={log.content}
                            onChangeText={text =>
                              updatePendingLog(log.id, text)
                            }
                            onFocus={() => setFocusedLogId(log.id)}
                            onBlur={() => setFocusedLogId(null)}
                            placeholderTextColor="#ccc"
                            multiline
                            maxLength={500}
                          />
                        </S.LogInputWrapper>
                      ) : (
                        <S.LogContent>{log.content}</S.LogContent>
                      )}
                    </S.LogTimelineContent>
                  </S.LogTimelineRow>
                );
              })}
              {pendingLogs.length > MAX_LENGTH_LOG && (
                <S.ViewAllButton
                  onPress={() => {
                    trackEvent('project_view_all_tapped', {
                      type: 'logs',
                      project_id: projectId,
                    });
                    navigation.navigate(PROJECTS_ROUTES.PROJECT_LOGS_ALL, {
                      projectId: projectId!,
                      projectTitle: project?.title,
                    });
                  }}>
                  <S.ViewAllButtonText>
                    전체 보기 ({pendingLogs.length}개)
                  </S.ViewAllButtonText>
                </S.ViewAllButton>
              )}
            </>
          )}
        </S.Section>

        {/* ══ 게시물 ════════════════════════════════════ */}
        <S.Section style={{borderBottomWidth: 0}}>
          <S.PostHeaderRow>
            <S.Label>게시물 ({posts.length})</S.Label>
            {isMyProject && posts.length > 0 && (
              <S.AddButton onPress={handleAddPostPress}>
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
                <S.EmptyAddButton onPress={handleAddPostPress}>
                  <S.EmptyAddButtonText>
                    첫 게시물 추가하기
                  </S.EmptyAddButtonText>
                </S.EmptyAddButton>
              )}
            </S.EmptyPosts>
          ) : (
            <>
              <View style={{gap: 16}}>
                {posts.slice(0, MAX_LENGTH_POST).map(post => (
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
                              <S.PostImage
                                source={{
                                  uri:
                                    toThumbnailUrl(img.image_url) ??
                                    img.image_url,
                                }}
                              />
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
                      <S.PostDateRow>
                        <Icon name="calendar" size={12} color="#191919" />
                        <S.PostDateText>
                          {new Date(post.created_at).toLocaleDateString(
                            'ko-KR',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            },
                          )}
                        </S.PostDateText>
                      </S.PostDateRow>
                      <PostContentPreview content={post.content ?? ''} />
                    </TouchableOpacity>
                  </S.PostCard>
                ))}
              </View>
              {posts.length > MAX_LENGTH_POST && (
                <S.ViewAllButton
                  onPress={() => {
                    trackEvent('project_view_all_tapped', {
                      type: 'posts',
                      project_id: projectId,
                    });
                    navigation.navigate(PROJECTS_ROUTES.PROJECT_POSTS_ALL, {
                      projectId: projectId!,
                      projectTitle: project?.title,
                    });
                  }}>
                  <S.ViewAllButtonText>
                    전체 보기 ({posts.length}개)
                  </S.ViewAllButtonText>
                </S.ViewAllButton>
              )}
            </>
          )}
        </S.Section>

        <View style={{height: 40}} />
      </KeyboardAvoid>

      {!isCreateMode && (
        <ActionSheetModal
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          actions={[
            {
              label: isDeleting ? '삭제 중...' : '삭제하기',
              icon: '🗑️',
              onPress: handleDeleteProject,
              isDestructive: true,
            },
          ]}
        />
      )}

      <ActionSheetModal
        visible={pdfInfoVisible}
        onClose={() => setPdfInfoVisible(false)}
        showCancel={false}>
        <View style={{padding: 20, gap: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Icon name="lock" size={16} color="#555" />
            <S.InfoLabel style={{fontSize: 15}}>
              도안 PDF는 나만 볼 수 있어요
            </S.InfoLabel>
          </View>
          <S.InfoValue style={{color: '#999', lineHeight: 20}}>
            {
              '업로드한 도안 PDF는 나에게만 표시돼요.\n다른 사람의 프로젝트에서는 이 항목이 보이지 않아요.'
            }
          </S.InfoValue>
        </View>
      </ActionSheetModal>

      {!isCreateMode && (
        <CompletePostModal
          visible={completeModalVisible}
          onClose={() => setCompleteModalVisible(false)}
          onConfirm={handleConfirmComplete}
          initialVisibility={project?.visibility || 'private'}
        />
      )}

      {/* 캘린더 모달 */}
      <CalendarModal
        visible={showCalendar}
        mode={formIsCompleted ? 'range' : 'single'}
        initialDate={!formIsCompleted ? startedAt : undefined}
        initialStart={formIsCompleted ? startedAt : undefined}
        initialEnd={formIsCompleted ? completedAt : undefined}
        maxDate={new Date().toISOString().split('T')[0]}
        onConfirm={handleCalendarConfirm}
        onClose={() => setShowCalendar(false)}
      />

      {/* 대표이미지 선택 바텀시트 */}
      <ActionSheetModal
        visible={showThumbnailSheet}
        onClose={() => setShowThumbnailSheet(false)}
        actions={[
          {label: '갤러리에서 선택', onPress: handlePickThumbnailFromGallery},
          {label: '카메라로 촬영', onPress: handlePickThumbnailFromCamera},
          {
            label: '게시물에서 선택',
            onPress: () => {
              setShowThumbnailSheet(false);
              setTimeout(() => setShowPostImagePicker(true), 300);
            },
            disabled: allPostImages.length === 0,
          },
        ]}>
        <View style={{paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4}}>
          <S.InfoLabel style={{fontSize: 13, color: '#999'}}>
            언제든 다시 등록/수정할 수 있어요.
          </S.InfoLabel>
        </View>
      </ActionSheetModal>

      {/* 게시물 이미지 선택 모달 */}
      <Modal
        visible={showPostImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPostImagePicker(false)}>
        <S.PostImagePickerOverlay>
          <S.PostImagePickerSheet>
            <S.PostImagePickerHeader>
              <S.PostImagePickerTitle>게시물에서 선택</S.PostImagePickerTitle>
              <TouchableOpacity onPress={() => setShowPostImagePicker(false)}>
                <Icon name="x" size={20} color="#555" />
              </TouchableOpacity>
            </S.PostImagePickerHeader>
            <ScrollView>
              <S.PostImageGrid>
                {allPostImages.map((uri, idx) => (
                  <S.PostImageThumb
                    key={idx}
                    onPress={() => handlePickThumbnailFromPost(uri)}>
                    <FastImage
                      source={{uri}}
                      style={{width: '100%', height: '100%'}}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </S.PostImageThumb>
                ))}
              </S.PostImageGrid>
            </ScrollView>
          </S.PostImagePickerSheet>
        </S.PostImagePickerOverlay>
      </Modal>
    </S.Container>
  );
}
