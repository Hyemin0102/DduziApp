import React, {useState, useCallback} from 'react';
import {FlatList, ActivityIndicator, RefreshControl} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import * as S from './ProjectsScreen.styles';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {ProjectItem} from '@/@types/database';
import Icon from 'react-native-vector-icons/Feather';

export default function ProjectsScreen() {
  const {navigation} = useCommonNavigation<any>();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, []),
  );

  const fetchProjects = async () => {
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return;

      const {data, error} = await supabase
        .from('projects')
        .select('id, title, created_at, updated_at, is_completed, visibility')
        .eq('user_id', user.id)
        .order('created_at', {ascending: false});

      if (error) throw error;
      setProjects((data as ProjectItem[]) || []);
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleCreateProject = () => {
    navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {mode: 'create'});
  };

  const inProgressCount = projects.filter(p => !p.is_completed).length;
  const completedCount = projects.filter(p => p.is_completed).length;

  if (loading) {
    return (
      <S.Center>
        <ActivityIndicator size="large" color="#191919" />
      </S.Center>
    );
  }

  console.log(projects);
  

  return (
    <S.Container>
      {projects.length > 0 && (
        <S.Summary>
          <S.SummaryItem>
            <S.SummaryCount>{inProgressCount}</S.SummaryCount>
            <S.SummaryLabel>진행 중</S.SummaryLabel>
          </S.SummaryItem>
          <S.SummaryDivider />
          <S.SummaryItem>
            <S.SummaryCount>{completedCount}</S.SummaryCount>
            <S.SummaryLabel>완료</S.SummaryLabel>
          </S.SummaryItem>
        </S.Summary>
      )}

      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        contentContainerStyle={
          projects.length === 0 ? {flex: 1} : {padding: 16, gap: 10}
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <S.Empty>
            <S.EmptyIcon>🧶</S.EmptyIcon>
            <S.EmptyText>아직 프로젝트가 없어요</S.EmptyText>
            <S.EmptySubText>첫 프로젝트를 시작해보세요!</S.EmptySubText>
            <S.EmptyButton onPress={handleCreateProject}>
              <S.EmptyButtonText>프로젝트 추가하기</S.EmptyButtonText>
            </S.EmptyButton>
          </S.Empty>
        }
        renderItem={({item}) => (
          <S.Card
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
                projectId: item.id,
                projectTitle: item.title,
              })
            }>
            <S.CardLeft>
              <S.StatusDot completed={item.is_completed} />
              <S.CardInfo>
                <S.CardTitle numberOfLines={1}>{item.title}</S.CardTitle>
                <S.CardDate>
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </S.CardDate>
              </S.CardInfo>
            </S.CardLeft>
            <S.CardRight>
              <S.StatusBadge
                variant={item.is_completed ? 'completed' : 'progress'}>
                {item.is_completed ? '완료' : '진행 중'}
              </S.StatusBadge>
              <S.StatusBadge
                variant={item.visibility === 'public' ? 'public' : 'private'}>
                {item.visibility === 'public' ? '공개' : '비공개'}
              </S.StatusBadge>
              <Icon name="chevron-right" size={16} color="#ccc" />
            </S.CardRight>
          </S.Card>
        )}
      />

      {/* {projects.length > 0 && (
        <S.AddButton onPress={handleCreateProject}>
          <Icon name="plus" size={16} color="#fff" />
          <S.AddButtonText>새 프로젝트 추가</S.AddButtonText>
        </S.AddButton>
      )} */}
      <S.FAB onPress={handleCreateProject}>
        <Icon name="plus" size={22} color="#fff" />
      </S.FAB>
    </S.Container>
  );
}
