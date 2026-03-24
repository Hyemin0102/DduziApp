import React from 'react';
import {Alert} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import * as S from './Mypage.style';

const Mypage = () => {
  const {user, logout} = useAuth();
  const {navigation} = useCommonNavigation();

  const handleProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  const handleProject = () => {
    navigation.navigate('ProjectsMain');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
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
        <S.MenuSection>
          <S.MenuItem onPress={handleProfile}>
            <S.MenuText>프로필 편집</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>

          {/* <S.MenuItem onPress={handleProject}>
            <S.MenuText>프로젝트 관리</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem> */}

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
