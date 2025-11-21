import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {UserProfile} from '../@types/auth';

interface UserProfileCardProps {
  user: UserProfile;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({user}) => {
  const getProviderLabel = () => {
    switch (user.provider) {
      case 'kakao':
        return '카카오';
      case 'naver':
        return '네이버';
      case 'google':
        return '구글';
      default:
        return '';
    }
  };

  console.log('dddd', user.rawProfile);
  console.log('profileImage:', user.profileImage);

  const getProviderColor = () => {
    switch (user.provider) {
      case 'kakao':
        return '#FEE500';
      case 'naver':
        return '#03C75A';
      case 'google':
        return '#4285F4';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {/* 프로필 이미지 */}
      {user.profileImage ? (
        <Image source={{uri: user.profileImage}} style={styles.profileImage} />
      ) : (
        <View style={styles.profileImagePlaceholder}>
          <Text style={styles.profileImagePlaceholderText}>
            {user.name?.charAt(0) || user.nickname?.charAt(0) || '?'}
          </Text>
        </View>
      )}

      {/* 사용자 정보 */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>
          {user.name || user.nickname || '이름 없음'}
        </Text>

        {user.email && <Text style={styles.email}>{user.email}</Text>}

        {/* 로그인 제공자 뱃지 */}
        <View
          style={[styles.providerBadge, {backgroundColor: getProviderColor()}]}>
          <Text style={styles.providerText}>{getProviderLabel()} 계정</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImagePlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#666',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

export default UserProfileCard;
