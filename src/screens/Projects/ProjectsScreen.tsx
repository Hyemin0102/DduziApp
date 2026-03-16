import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
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
    navigation.navigate('PostCreate');
  };

  const inProgressCount = projects.filter(p => !p.is_completed).length;
  const completedCount = projects.filter(p => p.is_completed).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6b4fbb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 요약 */}
      {projects.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{inProgressCount}</Text>
            <Text style={styles.summaryLabel}>진행 중</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{completedCount}</Text>
            <Text style={styles.summaryLabel}>완료</Text>
          </View>
        </View>
      )}

      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        contentContainerStyle={
          projects.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧶</Text>
            <Text style={styles.emptyText}>아직 프로젝트가 없어요</Text>
            <Text style={styles.emptySubText}>첫 프로젝트를 시작해보세요!</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreateProject}>
              <Text style={styles.emptyButtonText}>프로젝트 추가하기</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
                projectId: item.id,
                projectTitle: item.title,
              })
            }>
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.statusDot,
                  item.is_completed ? styles.dotCompleted : styles.dotProgress,
                ]}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardDate}>
                  {new Date(item.updated_at).toLocaleDateString('ko-KR')}
                </Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text
                style={[
                  styles.statusBadge,
                  item.is_completed
                    ? styles.badgeCompleted
                    : styles.badgeProgress,
                ]}>
                {item.is_completed ? '완료' : '진행 중'}
              </Text>
              <Text
                style={[
                  styles.statusBadge,
                  item.visibility === 'public'
                    ? styles.badgePublic
                    : styles.badgePrivate,
                ]}>
                {item.visibility === 'public' ? '공개' : '비공개'}
              </Text>
              <Icon name="chevron-right" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 하단 프로젝트 추가 버튼 */}
      {projects.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateProject}>
          {/* <Icon name="plus" size={24} color="#fff" /> */}
          <Text style={styles.addText}>새 프로젝트 추가</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#eee',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6b4fbb',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: '#6b4fbb',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotProgress: {
    backgroundColor: '#6b4fbb',
  },
  dotCompleted: {
    backgroundColor: '#4CAF50',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeProgress: {
    backgroundColor: '#f0ecff',
    color: '#6b4fbb',
  },
  badgeCompleted: {
    backgroundColor: '#e8f5e9',
    color: '#4CAF50',
  },
  badgePublic: {
    backgroundColor: '#e3f2fd',
    color: '#1976D2',
  },
  badgePrivate: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#6b4fbb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6b4fbb',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addText: {
    color: '#fff',
  },
});
