import React, {useState, useEffect} from 'react';
import {Alert, ActivityIndicator, Linking} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/Feather';
import {useAuth} from '../../contexts/AuthContext';
import {deleteAccount} from '@/lib/auth/deleteAccount';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {MY_PAGE_ROUTES} from '@/constants/navigation.constant';
import * as S from './Settings.style';

const APP_VERSION = DeviceInfo.getVersion();
const BUNDLE_ID = 'com.dduzi.app';
const FEEDBACK_EMAIL = 'hyeminjo0102@gmail.com';

const Settings = () => {
  const {provider} = useAuth();
  const {navigation} = useCommonNavigation<any>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [versionStatus, setVersionStatus] = useState<'loading' | 'latest' | 'update' | 'unknown'>('loading');

  useEffect(() => {
    fetch(
      `https://itunes.apple.com/lookup?bundleId=${BUNDLE_ID}&country=kr`,
    )
      .then(res => res.json())
      .then(json => {
      
        
        if (json.resultCount > 0) {
          const storeVersion: string = json.results[0].version;
          //setVersionStatus(storeVersion === APP_VERSION ? 'latest' : 'update');
        setVersionStatus("latest")
        } else {
          //setVersionStatus('unknown');
          setVersionStatus("latest")
        }
      })
      .catch(() => setVersionStatus('unknown'));
  }, []);
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

  const handleNotice = () => {
    navigation.navigate(MY_PAGE_ROUTES.NOTICE_LIST);
  };

  const handleContact = () => {
    Linking.openURL(
      `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('[뜨지] 피드백')}`,
    );
  };

  const handleCopyEmail = () => {
    Clipboard.setString(FEEDBACK_EMAIL);
    Alert.alert('복사 완료', '이메일 주소가 복사되었습니다.');
  };

  const handleTermsOfService = () => {
    Linking.openURL(
      'https://amenable-shelf-49d.notion.site/38adaa46954d8089a9cdf7d6d68e55b0?pvs=73',
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(
      'https://amenable-shelf-49d.notion.site/34adaa46954d80318ddacb8802c866e1',
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(provider);
    } catch (error) {
      console.error('회원탈퇴 에러:', error);
      const message =
        provider === 'apple'
          ? 'Apple 계정 연결 해제에 실패했습니다.\n잠시 후 다시 시도해주세요.'
          : '회원탈퇴 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.';
      Alert.alert('오류', message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleting) {
    return (
      <S.Container>
        <S.CenterContainer>
          <ActivityIndicator size="large" color="#999" />
        </S.CenterContainer>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.ScrollView contentContainerStyle={{paddingVertical: 16, gap: 8}}>
<S.SectionLabel>정보</S.SectionLabel>
        <S.MenuSection>
          <S.MenuItem activeOpacity={1}>
            <S.MenuText>앱 버전</S.MenuText>
            <S.VersionBadge isLatest={versionStatus === 'latest'}>
              <S.VersionText>{APP_VERSION}</S.VersionText>
              {versionStatus === 'latest' && (
                <S.LatestBadge>
                  <S.LatestBadgeText>최신</S.LatestBadgeText>
                </S.LatestBadge>
              )}
              {versionStatus === 'update' && (
                <S.UpdateBadge>
                  <S.UpdateBadgeText>업데이트 있음</S.UpdateBadgeText>
                </S.UpdateBadge>
              )}
            </S.VersionBadge>
          </S.MenuItem>
          <S.MenuItem onPress={handleNotice}>
            <S.MenuText>공지사항</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
          <S.MenuItem onPress={handlePrivacyPolicy}>
            <S.MenuText>개인정보 처리방침</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
          <S.MenuItem onPress={handleTermsOfService}>
            <S.MenuText>서비스 이용약관</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
        </S.MenuSection>

        <S.FeedbackSection>
          <S.FeedbackButton onPress={handleContact}>
            <S.FeedbackButtonText>피드백 보내기</S.FeedbackButtonText>
          </S.FeedbackButton>
          <S.HintText style={{textAlign: 'center', marginTop: 8}}>
            메일 자동 연결이 안 될 경우 아래 주소로 보내주세요.
          </S.HintText>
          <S.FeedbackHintRow onPress={handleCopyEmail}>
            <S.HintText>{FEEDBACK_EMAIL}</S.HintText>
            <Icon name="copy" size={13} color="#999" />
          </S.FeedbackHintRow>
        </S.FeedbackSection>

        <S.DeleteButton onPress={handleDeleteAccount}>
          <S.DeleteButtonText>회원탈퇴</S.DeleteButtonText>
        </S.DeleteButton>
      </S.ScrollView>
    </S.Container>
  );
};

export default Settings;
