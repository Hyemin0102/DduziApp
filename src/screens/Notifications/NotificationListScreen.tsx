import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import {thumbnailUrl} from '@/lib/imageTransform';
import {useAuth} from '@/contexts/AuthContext';
import {navigateFromNotificationData} from '@/lib/navigationRef';
import useCommonNavigation from '@/hooks/useCommonNavigation';

interface NotificationItem {
  id: string;
  type: 'notice' | 'project_post' | 'post_like' | 'comment';
  title: string;
  body: string;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

// 좋아요/댓글 알림은 "닉네임" 부분만 굵게 보여주려고, DB가 평문으로 합쳐둔
// body 대신 data.nickname + 이 접미사로 클라이언트에서 다시 조립함
// (SQL 쪽 문구가 바뀌면 여기도 같이 맞춰야 함 — supabase/migrations/20261005050000_personalize_like_comment_notification_body.sql)
const NICKNAME_NOTIFICATION_SUFFIX: Partial<Record<NotificationItem['type'], string>> = {
  post_like: '님이 회원님의 게시물을 좋아합니다.',
  comment: '님이 댓글을 남겼습니다.',
};

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
  const [postThumbnails, setPostThumbnails] = useState<Record<string, string>>({});
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

        const postIds = Array.from(
          new Set(
            (data as NotificationItem[])
              .map(n => n.data?.postId)
              .filter((id): id is string => !!id),
          ),
        );
        const projectIds = Array.from(
          new Set(
            (data as NotificationItem[])
              .filter(n => n.type === 'project_post')
              .map(n => n.data?.projectId)
              .filter((id): id is string => !!id),
          ),
        );

        const [postsRes, projectsRes] = await Promise.all([
          postIds.length > 0
            ? supabase
                .from('posts')
                .select('id, post_images ( image_url, display_order )')
                .in('id', postIds)
            : Promise.resolve({data: [] as any[]}),
          projectIds.length > 0
            ? supabase.from('projects').select('id, thumbnail_url').in('id', projectIds)
            : Promise.resolve({data: [] as any[]}),
        ]);

        const postThumbs: Record<string, string> = {};
        (postsRes.data || []).forEach((post: any) => {
          const firstImage = [...(post.post_images || [])].sort(
            (a: any, b: any) => a.display_order - b.display_order,
          )[0]?.image_url;
          if (firstImage) postThumbs[post.id] = firstImage;
        });
        (projectsRes.data || []).forEach((project: any) => {
          if (project.thumbnail_url) postThumbs[`project:${project.id}`] = project.thumbnail_url;
        });
        setPostThumbnails(postThumbs);

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
      renderItem={({item}) => {
        const nickname = item.data?.nickname;
        const suffix = NICKNAME_NOTIFICATION_SUFFIX[item.type];
        const projectThumbnail = item.data?.projectId
          ? postThumbnails[`project:${item.data.projectId}`]
          : undefined;
        const thumbnail =
          projectThumbnail ?? (item.data?.postId ? postThumbnails[item.data.postId] : undefined);

        return (
          <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
            {!item.is_read && <View style={styles.unreadDot} />}
            <View style={styles.rowContent}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>
                {nickname && suffix ? (
                  <>
                    <Text style={styles.bodyBold}>{nickname}</Text>
                    {suffix}
                  </>
                ) : (
                  item.body
                )}
              </Text>
              <Text style={styles.date}>{formatRelativeTime(item.created_at)}</Text>
            </View>
            {thumbnail && (
              <Image
                source={{uri: thumbnailUrl(thumbnail) ?? thumbnail}}
                style={styles.thumbnail}
              />
            )}
          </TouchableOpacity>
        );
      }}
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
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
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
  bodyBold: {
    fontWeight: '700',
    color: '#191919',
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
