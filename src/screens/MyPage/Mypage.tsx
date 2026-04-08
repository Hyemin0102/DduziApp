import React from 'react';
import {Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useAuth} from '../../contexts/AuthContext';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {MY_PAGE_ROUTES, TAB_ROUTES} from '@/constants/navigation.constant';
import * as S from './Mypage.style';

const Mypage = () => {
  const {user, logout} = useAuth();
  const {navigation} = useCommonNavigation();

  const handleProfile = () => {
    navigation.navigate(MY_PAGE_ROUTES.PROFILE_EDIT);
  };

  const handleSettings = () => {
    navigation.navigate(MY_PAGE_ROUTES.SETTINGS);
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('로그아웃 에러:', error);
            Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <S.Container>
        <S.CenterContainer>
          <S.ErrorText>사용자 정보를 불러올 수 없습니다.</S.ErrorText>
        </S.CenterContainer>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.ScrollView>
        <S.ProfileCard onPress={handleProfile}>
          {user.profile_image ? (
            <S.ProfileAvatar
              source={{uri: user.profile_image}}
              resizeMode="cover"
            />
          ) : (
            <S.ProfileAvatarPlaceholder>
              <Icon name="user" size={28} color="#bbb" />
            </S.ProfileAvatarPlaceholder>
          )}
          <S.ProfileInfo>
            <S.ProfileName>{user.nickname ?? '이름 없음'}</S.ProfileName>
            <S.ProfileSubText>프로필 수정</S.ProfileSubText>
          </S.ProfileInfo>
          <S.ProfileArrow>›</S.ProfileArrow>
        </S.ProfileCard>

        <S.MenuSection>
          <S.MenuItem onPress={handleSettings}>
            <S.MenuText>설정</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>

          <S.LogoutMenuItem onPress={handleLogout}>
            <S.LogoutText>로그아웃</S.LogoutText>
          </S.LogoutMenuItem>
        </S.MenuSection>
      </S.ScrollView>
    </S.Container>
  );
};

export default Mypage;
