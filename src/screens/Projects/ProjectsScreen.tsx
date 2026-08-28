import React, {useState, useCallback, useEffect} from 'react';
import {FlatList, ScrollView, ActivityIndicator, RefreshControl, Alert, Modal} from 'react-native';
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
import {trackEvent} from '@/lib/mixpanel';

type TabType = 'inProgress' | 'completed' | 'saved';

interface SavedProject {
  savedId: string;
  savedAt: string;
  projectId: string;
  title: string;
  visibility: 'public' | 'private';
  isCompleted: boolean;
  ownerNickname: string;
  ownerProfileImage: string | null;
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

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, []),
  );

  const fetchAll = async () => {
    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) return;

      const [projectsRes, savedRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title, created_at, updated_at, is_completed, visibility, thumbnail_url, started_at, completed_at')
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
                profile_image
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', {ascending: false}),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      setMyProjects((projectsRes.data as ProjectItem[]) || []);

      if (!savedRes.error && savedRes.data) {
        const saved: SavedProject[] = (savedRes.data as any[]).map(item => ({
          savedId: item.id,
          savedAt: item.created_at,
          projectId: item.project_id,
          title: item.projects.title,
          visibility: item.projects.visibility,
          isCompleted: item.projects.is_completed,
          ownerNickname: item.projects.users.nickname,
          ownerProfileImage: item.projects.users.profile_image,
          thumbnailUrl: item.projects.thumbnail_url,
          startedAt: item.projects.started_at,
          completedAt: item.projects.completed_at,
        }));
        setSavedProjects(saved);
      }
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
    trackEvent('projects_tab_switched', {tab});
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(savedProjects.map(p => p.savedId));
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedIds([]);
  };

  const handleConfirmDelete = async () => {
    try {
      await supabase.from('saved_projects').delete().in('id', selectedIds);
      setSavedProjects(prev => prev.filter(p => !selectedIds.includes(p.savedId)));
      setShowDeleteConfirm(false);
      setSelectedIds([]);
      setIsEditMode(false);
    } catch {
      setShowDeleteConfirm(false);
      Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
    }
  };

  const inProgressProjects = myProjects.filter(p => !p.is_completed);
  const completedProjects = myProjects.filter(p => p.is_completed);
  const activeSaved = savedProjects.filter(p => p.visibility === 'public');
  const privateSaved = savedProjects.filter(p => p.visibility === 'private');

  const renderMyProject = (item: ProjectItem) => {
    const dateLabel = getProjectDateLabel(item.is_completed, item.started_at, item.completed_at);

    return (
    <S.Card
      key={item.id}
      activeOpacity={0.75}
      onPress={() =>
        navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
          projectId: item.id,
          projectTitle: item.title,
        })
      }>
      <S.CardLeft>
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
        <Icon name="chevron-right" size={16} color="#ccc" />
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
    activeTab === 'inProgress' ? inProgressProjects : completedProjects;

  return (
    <S.Container>
      {/* Summary (탭 역할 겸) */}
      <S.Summary>
        <S.SummaryItem onPress={() => switchTab('inProgress')}>
          <S.SummaryCount active={activeTab === 'inProgress'}>
            {inProgressProjects.length}
          </S.SummaryCount>
          <S.SummaryLabel active={activeTab === 'inProgress'}>진행 중</S.SummaryLabel>
        </S.SummaryItem>
        <S.SummaryDivider />
        <S.SummaryItem onPress={() => switchTab('completed')}>
          <S.SummaryCount active={activeTab === 'completed'}>
            {completedProjects.length}
          </S.SummaryCount>
          <S.SummaryLabel active={activeTab === 'completed'}>완료</S.SummaryLabel>
        </S.SummaryItem>
        <S.SummaryDivider />
        <S.SummaryItem onPress={() => switchTab('saved')}>
          <S.SummaryCount active={activeTab === 'saved'}>
            {savedProjects.length}
          </S.SummaryCount>
          <S.SummaryLabel active={activeTab === 'saved'}>뜨개함</S.SummaryLabel>
        </S.SummaryItem>
      </S.Summary>

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
          contentContainerStyle={{flexGrow: 1}}
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
                {activeTab === 'inProgress'
                  ? '진행 중인 프로젝트가 없어요'
                  : '완료된 프로젝트가 없어요'}
              </S.EmptyText>
              <S.EmptySubText>
                {activeTab === 'inProgress'
                  ? '첫 프로젝트를 시작해보세요!'
                  : '프로젝트를 완료해보세요!'}
              </S.EmptySubText>
            </S.Empty>
          }
          renderItem={({item}) => renderMyProject(item)}
        />
      )}

      {activeTab !== 'saved' && (
        <S.AddButton onPress={handleCreateProject}>
          <S.AddButtonText>새 프로젝트</S.AddButtonText>
          <Icon name="plus" size={15} color="#fff" />
        </S.AddButton>
      )}

      {activeTab === 'saved' && isEditMode && (
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
              프로젝트를 삭제하면 뜨개함에서 더는 확인할 수 없어요.
            </S.ConfirmDescription>
            <S.ConfirmButtonRow>
              <S.ConfirmCancelButton onPress={() => setShowDeleteConfirm(false)}>
                <S.ConfirmCancelText>취소</S.ConfirmCancelText>
              </S.ConfirmCancelButton>
              <S.ConfirmDeleteButton onPress={handleConfirmDelete}>
                <S.ConfirmDeleteText>프로젝트 삭제</S.ConfirmDeleteText>
              </S.ConfirmDeleteButton>
            </S.ConfirmButtonRow>
          </S.ConfirmModalContainer>
        </S.ConfirmOverlay>
      </Modal>
    </S.Container>
  );
}
