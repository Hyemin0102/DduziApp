import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, View, StyleSheet} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import {MyPageStackParamList} from '@/@types/navigation';
import {MY_PAGE_ROUTES} from '@/constants/navigation.constant';

type RouteProps = RouteProp<MyPageStackParamList, typeof MY_PAGE_ROUTES.NOTICE_DETAIL>;

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function NoticeDetailScreen() {
  const {params} = useRoute<RouteProps>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('notices')
      .select('id, title, content, created_at')
      .eq('id', params.noticeId)
      .single()
      .then(({data, error}) => {
        if (!error) setNotice(data as Notice);
        setLoading(false);
      });
  }, [params.noticeId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  if (!notice) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>공지사항을 찾을 수 없습니다</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.date}>
        {new Date(notice.created_at).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
      <Text style={styles.body}>{notice.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {fontSize: 15, color: '#999'},
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#191919',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
});
