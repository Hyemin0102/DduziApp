import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {navigateFromNotificationData} from '@/lib/navigationRef';
import useCommonNavigation from '@/hooks/useCommonNavigation';

interface NotificationItem {
  id: string;
  type: 'notice' | 'project_post';
  title: string;
  body: string;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function NotificationListScreen() {
  const {navigation} = useCommonNavigation();
  const {user} = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);

      const {data, error} = await supabase
        .from('notifications')
        .select('id, type, title, body, data, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', {ascending: false})
        .limit(50);

      if (!error && data) {
        setNotifications(data as NotificationItem[]);

        // 목록에 보이는 것과 상관없이(50개 제한 밖의 것 포함) 안 읽은 알림을
        // 전부 읽음 처리 — 홈 헤더 뱃지는 전체 안읽음 개수를 세기 때문에,
        // 화면에 보이는 50개만 처리하면 그 밖의 안읽음이 남아 뱃지가 안 꺼짐
        const {error: updateError} = await supabase
          .from('notifications')
          .update({is_read: true})
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (updateError) {
          console.error('알림 읽음 처리 실패:', updateError);
        } else {
          setNotifications(prev => prev.map(n => ({...n, is_read: true})));
        }
      }
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const handlePress = (item: NotificationItem) => {
    if (item.data) navigateFromNotificationData(item.data);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchNotifications(true)}
        />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>받은 알림이 없어요</Text>
        </View>
      }
      renderItem={({item}) => (
        <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
          {!item.is_read && <View style={styles.unreadDot} />}
          <View style={styles.rowContent}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.date}>{formatRelativeTime(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  list: {backgroundColor: '#fff', flexGrow: 1},
  emptyText: {fontSize: 15, color: '#999'},
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginTop: 6,
  },
  rowContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
  },
});
