import React, {useState, useCallback, useEffect} from 'react';
import {
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import * as S from './ProjectsScreen.styles';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {ProjectItem} from '@/@types/database';
import Icon from 'react-native-vector-icons/Feather';
import {profileUrl} from '@/lib/imageTransform';
import {getProjectDateLabel} from '@/lib/projectDate';
import SavedProjectCard from '@/components/common/SavedProjectCard';
import {deleteProjects} from '@/lib/deleteProjects';

type TabType = 'planned' | 'inProgress' | 'completed' | 'saved';

const TAB_STATUS = {
  planned: 'planned',
  inProgress: 'in_progress',
  completed: 'completed',
} as const;

const TAB_LABEL = {
  planned: '예정',
  inProgress: '진행 중',
  completed: '완료',
} as const;

interface SavedProject {
  savedId: string;
  savedAt: string;
  projectId: string;
  title: string;
  visibility: 'public' | 'private';
  isCompleted: boolean;
  ownerNickname: string;
  ownerProfileImage: string | null;
  ownerSupporterLevel: 1 | 2 | 3 | null;
  ownerShowSupporterBadge: boolean;
  thumbnailUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export default function ProjectsScreen() {
  const {navigation} = useCommonNavigation<any>();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState<TabType>('inProgress');

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);
  const [myProjects, setMyProjects] = useState<ProjectItem[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, []),
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('projectCreated', () => {
      fetchAll();
    });
    return () => subscription.remove();
  }, []);

  const fetchAll = async () => {
    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) return;

      const [projectsRes, savedRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title, created_at, updated_at, is_completed, status, visibility, thumbnail_url, started_at, completed_at')
          .eq('user_id', user.id)
          .order('created_at', {ascending: false}),
        supabase
          .from('saved_projects')
          .select(`
            id,
            created_at,
            project_id,
            projects!inner (
              id,
              title,
              visibility,
              is_completed,
              thumbnail_url,
              started_at,
              completed_at,
              users!inner (
                nickname,
                profile_image,
                supporter_level,
                show_supporter_badge
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', {ascending: false}),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      let myProjectsData = (projectsRes.data as ProjectItem[]) || [];

      let savedData: SavedProject[] = [];
      if (!savedRes.error && savedRes.data) {
        savedData = (savedRes.data as any[]).map(item => ({
          savedId: item.id,
          savedAt: item.created_at,
          projectId: item.project_id,
          title: item.projects.title,
          visibility: item.projects.visibility,
          isCompleted: item.projects.is_completed,
          ownerNickname: item.projects.users.nickname,
          ownerProfileImage: item.projects.users.profile_image,
          ownerSupporterLevel: item.projects.users.supporter_level,
          ownerShowSupporterBadge: item.projects.users.show_supporter_badge,
          thumbnailUrl: item.projects.thumbnail_url,
          startedAt: item.projects.started_at,
          completedAt: item.projects.completed_at,
        }));
      }

      // 대표이미지가 없는 프로젝트는 가장 먼저 올린 게시물의 첫 사진으로 대체
      const missingThumbnailIds = Array.from(
        new Set([
          ...myProjectsData.filter(p => !p.thumbnail_url).map(p => p.id),
          ...savedData.filter(p => !p.thumbnailUrl).map(p => p.projectId),
        ]),
      );

      if (missingThumbnailIds.length > 0) {
        const {data: postsData} = await supabase
          .from('posts')
          .select('project_id, created_at, post_images ( image_url, display_order )')
          .in('project_id', missingThumbnailIds)
          .order('created_at', {ascending: true});

        const fallbackThumbnails: Record<string, string> = {};
        postsData?.forEach((post: any) => {
          if (fallbackThumbnails[post.project_id]) return;
          const firstImage = (post.post_images || [])
            .slice()
            .sort((a: any, b: any) => a.display_order - b.display_order)[0];
          if (firstImage?.image_url) {
            fallbackThumbnails[post.project_id] = firstImage.image_url;
          }
        });

        myProjectsData = myProjectsData.map(p =>
          p.thumbnail_url || !fallbackThumbnails[p.id]
            ? p
            : {...p, thumbnail_url: fallbackThumbnails[p.id]},
        );
        savedData = savedData.map(p =>
          p.thumbnailUrl || !fallbackThumbnails[p.projectId]
            ? p
            : {...p, thumbnailUrl: fallbackThumbnails[p.projectId]},
        );
      }

      setMyProjects(myProjectsData);
      setSavedProjects(savedData);
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleCreateProject = () => {
    navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {mode: 'create'});
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsEditMode(false);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  // 뜨개함은 저장 id, 내 프로젝트 탭은 프로젝트 id로 선택
  const handleSelectAll = () => {
    setSelectedIds(
      activeTab === 'saved'
        ? savedProjects.map(p => p.savedId)
        : myProjects.filter(p => p.status === TAB_STATUS[activeTab]).map(p => p.id),
    );
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedIds([]);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (activeTab === 'saved') {
        // 뜨개함: 저장만 해제
        await supabase.from('saved_projects').delete().in('id', selectedIds);
        setSavedProjects(prev => prev.filter(p => !selectedIds.includes(p.savedId)));
      } else {
        // 내 프로젝트: 게시물/로그/이미지/PDF까지 삭제 (프로젝트 상세 삭제와 동일)
        await deleteProjects(selectedIds);
        setMyProjects(prev => prev.filter(p => !selectedIds.includes(p.id)));
      }
      setShowDeleteConfirm(false);
      setSelectedIds([]);
      setIsEditMode(false);
    } catch (e) {
      console.error('프로젝트 삭제 실패:', e);
      setShowDeleteConfirm(false);
      Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
      // 일부만 지워졌을 수 있으니 목록 다시 조회
      if (activeTab !== 'saved') fetchAll();
    } finally {
      setIsDeleting(false);
    }
  };

  const plannedProjects = myProjects.filter(p => p.status === 'planned');
  const inProgressProjects = myProjects.filter(p => p.status === 'in_progress');
  const completedProjects = myProjects.filter(p => p.status === 'completed');
  const activeSaved = savedProjects.filter(p => p.visibility === 'public');
  const privateSaved = savedProjects.filter(p => p.visibility === 'private');

  const renderMyProject = (item: ProjectItem) => {
    const dateLabel = getProjectDateLabel(item.is_completed, item.started_at, item.completed_at);
    const isSelected = selectedIds.includes(item.id);

    return (
    <S.Card
      key={item.id}
      activeOpacity={0.75}
      onPress={() =>
        isEditMode
          ? toggleSelect(item.id)
          : navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
              projectId: item.id,
              projectTitle: item.title,
            })
      }>
      <S.CardLeft>
        {isEditMode && (
          <S.SelectCircle selected={isSelected}>
            {isSelected && <Icon name="check" size={11} color="#fff" />}
          </S.SelectCircle>
        )}
        <S.CardInfo>
          <S.TitleRow>
            <S.CardTitle numberOfLines={1}>{item.title}</S.CardTitle>
            {item.visibility !== 'public' && (
              <Icon name="lock" size={14} color="#bbb" />
            )}
          </S.TitleRow>
          {dateLabel && <S.CardDate>{dateLabel}</S.CardDate>}
        </S.CardInfo>
      </S.CardLeft>
      <S.CardRight>
        {item.thumbnail_url ? (
          <S.CardThumbnail source={{uri: item.thumbnail_url}} />
        ) : null}
        {!isEditMode && <Icon name="chevron-right" size={16} color="#ccc" />}
      </S.CardRight>
    </S.Card>
  );
  };

  const renderSavedProject = (item: SavedProject, disabled = false) => {
    const isSelected = selectedIds.includes(item.savedId);
    const avatarUri = profileUrl(item.ownerProfileImage) ?? item.ownerProfileImage;
    const dateLabel = getProjectDateLabel(item.isCompleted, item.startedAt, item.completedAt);
    return (
      <SavedProjectCard
        key={item.savedId}
        ownerNickname={item.ownerNickname}
        ownerAvatarUri={avatarUri}
        ownerSupporterLevel={item.ownerSupporterLevel}
        ownerShowSupporterBadge={item.ownerShowSupporterBadge}
        title={item.title}
        dateLabel={dateLabel}
        thumbnailUrl={item.thumbnailUrl}
        locked={disabled}
        touchDisabled={disabled && !isEditMode}
        leftAccessory={
          isEditMode ? (
            <S.SelectCircle selected={isSelected}>
              {isSelected && <Icon name="check" size={11} color="#fff" />}
            </S.SelectCircle>
          ) : undefined
        }
        onPress={() => {
          if (isEditMode) {
            toggleSelect(item.savedId);
          } else if (!disabled) {
            navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
              projectId: item.projectId,
              projectTitle: item.title,
            });
          }
        }}
      />
    );
  };

  if (loading) {
    return (
      <S.Center>
        <ActivityIndicator size="large" color="#191919" />
      </S.Center>
    );
  }

  const currentProjects =
    activeTab === 'planned'
      ? plannedProjects
      : activeTab === 'inProgress'
      ? inProgressProjects
      : completedProjects;

  return (
    <S.Container>
      {/* 탭 */}
      <S.TabContainer>
        <S.Tab active={activeTab === 'planned'} onPress={() => switchTab('planned')}>
          <S.TabText active={activeTab === 'planned'}>예정</S.TabText>
          {activeTab === 'planned' && <S.TabIndicator />}
        </S.Tab>
        <S.Tab active={activeTab === 'inProgress'} onPress={() => switchTab('inProgress')}>
          <S.TabText active={activeTab === 'inProgress'}>진행 중</S.TabText>
          {activeTab === 'inProgress' && <S.TabIndicator />}
        </S.Tab>
        <S.Tab active={activeTab === 'completed'} onPress={() => switchTab('completed')}>
          <S.TabText active={activeTab === 'completed'}>완료</S.TabText>
          {activeTab === 'completed' && <S.TabIndicator />}
        </S.Tab>
        <S.Tab active={activeTab === 'saved'} onPress={() => switchTab('saved')}>
          <S.TabText active={activeTab === 'saved'}>뜨개함</S.TabText>
          {activeTab === 'saved' && <S.TabIndicator />}
        </S.Tab>
      </S.TabContainer>

      {/* 뜨개함 탭 */}
      {activeTab === 'saved' ? (
        <ScrollView
          contentContainerStyle={{flexGrow: 1, paddingBottom: isEditMode ? 88 : 0}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {savedProjects.length === 0 ? (
            <S.Empty>
              <S.EmptyIcon
                source={require('../../assets/images/dduzi_image.png')}
                resizeMode="contain"
              />
              <S.EmptyText>저장한 프로젝트가 없어요</S.EmptyText>
              <S.EmptySubText>마음에 드는 프로젝트를 저장해보세요!</S.EmptySubText>
            </S.Empty>
          ) : (
            <>
              <S.SavedHeaderRow>
                <S.SavedHeaderTitle>저장한 프로젝트</S.SavedHeaderTitle>
                <S.SavedHeaderAction
                  onPress={() => {
                    if (isEditMode) {
                      handleSelectAll();
                    } else {
                      setIsEditMode(true);
                    }
                  }}>
                  <S.SavedHeaderActionText>
                    {isEditMode ? '모두선택' : '관리'}
                  </S.SavedHeaderActionText>
                </S.SavedHeaderAction>
              </S.SavedHeaderRow>
              {activeSaved.map(item => renderSavedProject(item))}
              {privateSaved.length > 0 && (
                <>
                  <S.SectionDivider />
                  <S.SectionHeader>비공개된 프로젝트</S.SectionHeader>
                  {privateSaved.map(item => renderSavedProject(item, true))}
                </>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        /* 진행중 / 완료 탭 */
        <FlatList
          data={currentProjects}
          keyExtractor={item => item.id}
          contentContainerStyle={{flexGrow: 1, paddingBottom: isEditMode ? 88 : 0}}
          ListHeaderComponent={
            currentProjects.length > 0 ? (
              <S.SavedHeaderRow>
                <S.SavedHeaderTitle>
                  {TAB_LABEL[activeTab as keyof typeof TAB_LABEL]} 프로젝트 {currentProjects.length}
                </S.SavedHeaderTitle>
                <S.SavedHeaderAction
                  onPress={() => (isEditMode ? handleSelectAll() : setIsEditMode(true))}>
                  <S.SavedHeaderActionText>
                    {isEditMode ? '모두선택' : '관리'}
                  </S.SavedHeaderActionText>
                </S.SavedHeaderAction>
              </S.SavedHeaderRow>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <S.Empty>
              <S.EmptyIcon
                source={require('../../assets/images/dduzi_image.png')}
                resizeMode="contain"
              />
              <S.EmptyText>
                {activeTab === 'planned'
                  ? '예정된 프로젝트가 없어요'
                  : activeTab === 'inProgress'
                  ? '진행 중인 프로젝트가 없어요'
                  : '완료된 프로젝트가 없어요'}
              </S.EmptyText>
              <S.EmptySubText>
                {activeTab === 'planned'
                  ? '새 프로젝트를 만들어보세요!'
                  : activeTab === 'inProgress'
                  ? '프로젝트를 시작해보세요!'
                  : '프로젝트를 완료해보세요!'}
              </S.EmptySubText>
            </S.Empty>
          }
          renderItem={({item}) => renderMyProject(item)}
        />
      )}

      {activeTab !== 'saved' && !isEditMode && (
        <S.AddButton onPress={handleCreateProject}>
          <S.AddButtonText>새 프로젝트</S.AddButtonText>
          <Icon name="plus" size={15} color="#fff" />
        </S.AddButton>
      )}

      {isEditMode && (
        <S.FloatingBar>
          <S.FloatingCancelButton onPress={handleCancelEdit}>
            <S.FloatingCancelText>취소</S.FloatingCancelText>
          </S.FloatingCancelButton>
          <S.FloatingDeleteButton
            disabled={selectedIds.length === 0}
            onPress={() => {
              if (selectedIds.length > 0) setShowDeleteConfirm(true);
            }}>
            <S.FloatingDeleteText>
              프로젝트 삭제 ({selectedIds.length})
            </S.FloatingDeleteText>
          </S.FloatingDeleteButton>
        </S.FloatingBar>
      )}

      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <S.ConfirmOverlay>
          <S.ConfirmModalContainer>
            <S.ConfirmTitle>프로젝트를 삭제할까요?</S.ConfirmTitle>
            <S.ConfirmDescription>
              {activeTab === 'saved'
                ? '프로젝트를 삭제하면 뜨개함에서 더는 확인할 수 없어요.'
                : `선택한 프로젝트 ${selectedIds.length}개와 게시물, 뜨개 로그가 모두 삭제돼요. 삭제한 프로젝트는 되돌릴 수 없어요.`}
            </S.ConfirmDescription>
            <S.ConfirmButtonRow>
              <S.ConfirmCancelButton onPress={() => setShowDeleteConfirm(false)}>
                <S.ConfirmCancelText>취소</S.ConfirmCancelText>
              </S.ConfirmCancelButton>
              <S.ConfirmDeleteButton onPress={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <S.ConfirmDeleteText>프로젝트 삭제</S.ConfirmDeleteText>
                )}
              </S.ConfirmDeleteButton>
            </S.ConfirmButtonRow>
          </S.ConfirmModalContainer>
        </S.ConfirmOverlay>
      </Modal>
    </S.Container>
  );
}
