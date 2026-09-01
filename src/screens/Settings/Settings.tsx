import React, {useState, useEffect} from 'react';
import {Alert, ActivityIndicator, Linking, Platform, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {useAuth} from '../../contexts/AuthContext';
import {deleteAccount} from '@/lib/auth/deleteAccount';
import {
  fetchAppVersionConfig,
  fetchIosAppStoreId,
  compareVersions,
  STORE_URLS,
} from '@/lib/appVersion';
import * as S from './Settings.style';

const APP_VERSION = DeviceInfo.getVersion();
const ANDROID_PACKAGE_ID = 'com.dduziapp';

const Settings = () => {
  const {provider} = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [versionStatus, setVersionStatus] = useState<'loading' | 'latest' | 'update' | 'unknown'>('loading');

  useEffect(() => {
    fetchAppVersionConfig().then(config => {
      if (!config) {
        setVersionStatus('unknown');
        return;
      }
      setVersionStatus(
        compareVersions(APP_VERSION, config.latest_version) < 0 ? 'update' : 'latest',
      );
    });
  }, []);

  const handleUpdatePress = async () => {
    if (versionStatus !== 'update') return;
    if (Platform.OS === 'ios') {
      const appStoreId = await fetchIosAppStoreId();
      if (appStoreId) Linking.openURL(STORE_URLS.ios(appStoreId));
    } else {
      Linking.openURL(STORE_URLS.android(ANDROID_PACKAGE_ID)).catch(() =>
        Linking.openURL(STORE_URLS.androidWeb(ANDROID_PACKAGE_ID)),
      );
    }
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
          <S.MenuItem
            onPress={versionStatus === 'update' ? handleUpdatePress : undefined}
            activeOpacity={versionStatus === 'update' ? 0.7 : 1}>
            <S.MenuText>앱 버전</S.MenuText>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
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
              {versionStatus === 'update' && <S.MenuArrow>›</S.MenuArrow>}
            </View>
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

        <S.DeleteButton onPress={handleDeleteAccount}>
          <S.DeleteButtonText>회원탈퇴</S.DeleteButtonText>
        </S.DeleteButton>
      </S.ScrollView>
    </S.Container>
  );
};

export default Settings;
