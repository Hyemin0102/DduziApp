import React from 'react';
import {Text, View, StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../components/contexts/AuthContext';
import UserProfileCard from '../../components/UserProfileCard';

const Home = () => {
  const {user} = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>홈</Text>

        {/* 사용자 프로필 카드 */}
        {user && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>환영합니다!</Text>
            <UserProfileCard user={user} />
          </View>
        )}

        {/* 메인 컨텐츠 */}
        <View style={styles.contentSection}>
          <Text style={styles.contentTitle}>Dduzi에 오신 것을 환영합니다</Text>
          <Text style={styles.contentText}>
            여기에 메인 콘텐츠가 표시됩니다.
          </Text>
        </View>

        {/* 추가 섹션 예시 */}
        <View style={styles.gridSection}>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>📝</Text>
            <Text style={styles.gridItemTitle}>게시글</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>🔍</Text>
            <Text style={styles.gridItemTitle}>탐색</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>💬</Text>
            <Text style={styles.gridItemTitle}>메시지</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>⚙️</Text>
            <Text style={styles.gridItemTitle}>설정</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  profileSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contentSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  gridItemText: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default Home;
