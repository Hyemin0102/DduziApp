import React, {useEffect, useState} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Feather';
import {useAuth} from '../../contexts/AuthContext';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {MY_PAGE_ROUTES, TAB_ROUTES} from '@/constants/navigation.constant';
import * as S from './Mypage.style';
import {profileUrl} from '@/lib/imageTransform';
import {trackEvent} from '@/lib/mixpanel';

const IOS_BUNDLE_ID = 'com.dduzi.app';
const ANDROID_PACKAGE_ID = 'com.dduziapp';
const FEEDBACK_EMAIL = 'hyeminjo0102@gmail.com';

const Mypage = () => {
  const {user, logout} = useAuth();
  const {navigation} = useCommonNavigation();
  const [appStoreId, setAppStoreId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}&country=kr`)
      .then(res => res.json())
      .then(json => {
        if (json.resultCount > 0) {
          setAppStoreId(String(json.results[0].trackId));
        }
      })
      .catch(() => {});
  }, []);

  const handleProfile = () => {
    navigation.navigate(MY_PAGE_ROUTES.PROFILE_EDIT);
  };

  const handleSettings = () => {
    navigation.navigate(MY_PAGE_ROUTES.SETTINGS);
  };

  const handleNotice = () => {
    navigation.navigate(MY_PAGE_ROUTES.NOTICE_LIST);
  };

  const handleContact = () => {
    trackEvent('feedback_button_tapped');
    Linking.openURL(
      `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('[뜨지] 피드백')}`,
    );
  };

  const handleAppReview = () => {
    trackEvent('app_review_tapped');
    if (Platform.OS === 'ios') {
      if (!appStoreId) return;
      Linking.openURL(
        `itms-apps://itunes.apple.com/app/id${appStoreId}?action=write-review`,
      );
    } else {
      Linking.openURL(`market://details?id=${ANDROID_PACKAGE_ID}`).catch(() =>
        Linking.openURL(
          `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`,
        ),
      );
    }
  };

  const handleCopyEmail = () => {
    Clipboard.setString(FEEDBACK_EMAIL);
    Alert.alert('복사 완료', '이메일 주소가 복사되었습니다.');
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
              source={{uri: profileUrl(user.profile_image) ?? user.profile_image}}
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

        <S.AccountSection>
          <S.AccountItem>
            <S.AccountLabel>연결된 소셜 계정</S.AccountLabel>
            <S.AccountValue>{user.provider}</S.AccountValue>
          </S.AccountItem>
          <S.AccountItem>
            <S.AccountLabel>연결된 이메일</S.AccountLabel>
            <S.AccountValue>{user.email || '-'}</S.AccountValue>
          </S.AccountItem>
        </S.AccountSection>

        <S.SectionLabel>고객센터</S.SectionLabel>
        <S.MenuSection style={{marginTop: 4}}>
          <S.MenuItem onPress={handleNotice}>
            <S.MenuText>공지사항</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
          <S.MenuItem onPress={handleContact}>
            <S.MenuText>피드백 보내기</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
          <S.MenuItem onPress={handleAppReview}>
            <S.MenuText>앱 리뷰 작성하기</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
        </S.MenuSection>
        <S.FeedbackHintRow onPress={handleCopyEmail}>
          <S.HintText>메일 연결이 안 될 경우 {FEEDBACK_EMAIL} 로 보내주세요</S.HintText>
          <Icon name="copy" size={12} color="#999" />
        </S.FeedbackHintRow>

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
