import React, {useState} from 'react';
import {Alert, ActivityIndicator} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {deleteAccount} from '@/lib/auth/deleteAccount';
import * as S from './Mypage.style';

const Mypage = () => {
  const {user, provider, logout} = useAuth();
  const {navigation} = useCommonNavigation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  const handleProject = () => {
    navigation.navigate('ProjectsMain');
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

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원탈퇴',
      '정말 탈퇴하시겠습니까?\n\n작성한 게시물, 프로젝트 등 모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(provider);
    } catch (error) {
      console.error('회원탈퇴 에러:', error);
      Alert.alert('오류', '회원탈퇴 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
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

  if (isDeleting) {
    return (
      <S.Container>
        <S.CenterContainer>
          <ActivityIndicator size="large" color="#999" />
          <S.ErrorText>탈퇴 처리 중...</S.ErrorText>
        </S.CenterContainer>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.ScrollView contentContainerStyle={{padding: 16, gap: 16}}>
        <S.MenuSection>
          <S.MenuItem onPress={handleProfile}>
            <S.MenuText>프로필 편집</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>

          <S.MenuItem onPress={handleProject}>
            <S.MenuText>프로젝트 관리</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>

          <S.MenuItem>
            <S.MenuText>설정</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
        </S.MenuSection>

        <S.LogoutButton onPress={handleLogout}>
          <S.LogoutButtonText>로그아웃</S.LogoutButtonText>
        </S.LogoutButton>

        <S.DeleteButton onPress={handleDeleteAccount}>
          <S.DeleteButtonText>회원탈퇴</S.DeleteButtonText>
        </S.DeleteButton>
      </S.ScrollView>
    </S.Container>
  );
};

export default Mypage;
