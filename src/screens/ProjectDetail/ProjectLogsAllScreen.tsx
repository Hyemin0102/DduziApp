import React, {useState, useCallback, useEffect} from 'react';
import {
  FlatList,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';

const PAGE_SIZE = 20;

type RouteParams = {
  ProjectLogsAll: {projectId: string; projectTitle?: string};
};

interface KnittingLog {
  id: string;
  content: string;
  created_at: string;
}

export default function ProjectLogsAllScreen() {
  const route = useRoute<RouteProp<RouteParams, 'ProjectLogsAll'>>();
  const {projectId} = route.params;

  const [logs, setLogs] = useState<KnittingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(
    async (pageNum: number) => {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const {data, error, count} = await supabase
        .from('knitting_logs')
        .select('id, content, created_at', {count: 'exact'})
        .eq('project_id', projectId)
        .order('created_at', {ascending: false})
        .range(from, to);

      if (error) return;

      const items = (data as KnittingLog[]) || [];
      if (pageNum === 0) {
        setLogs(items);
        if (count !== null) setTotalCount(count);
      } else {
        setLogs(prev => [...prev, ...items]);
      }
      setHasMore(items.length === PAGE_SIZE);
    },
    [projectId],
  );

  useEffect(() => {
    fetchLogs(0).finally(() => setLoading(false));
  }, [fetchLogs]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, fetchLogs]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        totalCount > 0 ? (
          <Text style={styles.totalCount}>총 {totalCount}개의 기록</Text>
        ) : null
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            size="small"
            color="#191919"
            style={styles.footer}
          />
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>로그가 없습니다</Text>
        </View>
      }
      renderItem={({item, index}) => {
        const isLast = index === logs.length - 1 && !hasMore;
        const dateObj = new Date(item.created_at);
        const isToday =
          new Date().toDateString() === dateObj.toDateString();
        return (
          <View style={styles.row}>
            {/* 타임라인 왼쪽 */}
            <View style={styles.dotCol}>
              <View style={[styles.dot, isToday && styles.dotActive]} />
              {!isLast && <View style={styles.line} />}
            </View>
            {/* 내용 */}
            <View style={[styles.content, isLast && styles.contentLast]}>
              <Text style={[styles.date, isToday && styles.dateActive]}>
                {isToday
                  ? `오늘 · ${dateObj.toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })}`
                  : dateObj.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
              </Text>
              <Text style={styles.body}>{item.content}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  list: {paddingTop: 8, paddingBottom: 40, paddingHorizontal: 20, backgroundColor: '#fff', flexGrow: 1},
  footer: {paddingVertical: 16},
  totalCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    marginTop: 8,
  },
  emptyText: {fontSize: 15, color: '#999'},
  row: {
    flexDirection: 'row',
  },
  dotCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 3,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#c8c8c8',
  },
  dotActive: {
    backgroundColor: '#191919',
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#e5e5e5',
    marginTop: 5,
    marginBottom: 0,
  },
  content: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  contentLast: {
    paddingBottom: 0,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    marginBottom: 6,
  },
  dateActive: {
    color: '#191919',
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    color: '#191919',
    lineHeight: 22,
  },
});
