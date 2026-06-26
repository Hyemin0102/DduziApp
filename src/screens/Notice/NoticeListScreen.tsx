import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import {MY_PAGE_ROUTES} from '@/constants/navigation.constant';

interface Notice {
  id: string;
  title: string;
  created_at: string;
}

export default function NoticeListScreen() {
  const navigation = useNavigation<any>();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('notices')
      .select('id, title, created_at')
      .order('created_at', {ascending: false})
      .then(({data, error}) => {
        if (!error) setNotices((data as Notice[]) || []);
        setLoading(false);
      });
  }, []);

  const handlePress = useCallback(
    (notice: Notice) => {
      navigation.navigate(MY_PAGE_ROUTES.NOTICE_DETAIL, {
        noticeId: notice.id,
        title: notice.title,
      });
    },
    [navigation],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  return (
    <FlatList
      data={notices}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>등록된 공지사항이 없습니다</Text>
        </View>
      }
      renderItem={({item}) => (
        <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 15,
    color: '#191919',
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
