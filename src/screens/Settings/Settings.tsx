import React, {useState, useEffect, useCallback} from 'react';
import {Alert, ActivityIndicator, Linking, Platform, View, Switch} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import {useAuth} from '../../contexts/AuthContext';
import {deleteAccount} from '@/lib/auth/deleteAccount';
import {trackEvent} from '@/lib/mixpanel';
import {supabase} from '@/lib/supabase';
import {
  requestNotificationPermission,
  registerDeviceToken,
} from '@/lib/notifications';
import {
  fetchAppVersionConfig,
  fetchIosAppStoreId,
  compareVersions,
  STORE_URLS,
} from '@/lib/appVersion';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {MY_PAGE_ROUTES} from '@/constants/navigation.constant';
import * as S from './Settings.style';

const APP_VERSION = DeviceInfo.getVersion();
const ANDROID_PACKAGE_ID = 'com.dduziapp';

const Settings = () => {
  const {navigation} = useCommonNavigation();
  const {user, provider, updateUserProfile} = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [isUpdatingLikeNotifications, setIsUpdatingLikeNotifications] = useState(false);
  const [isUpdatingCommentNotifications, setIsUpdatingCommentNotifications] = useState(false);
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

  // 로그인 직후 자동 권한요청(AuthContext)이 notifications_enabled를 DB에 쓰는 것과
  // 거의 동시에 onAuthStateChange의 checkAuthStatus()도 유저를 다시 fetch해서
  // setUser하는 레이스가 있어서, context의 알림 설정 값이 DB와 어긋날 수 있음.
  // 화면 진입마다 DB에서 직접 다시 읽어와 context를 맞춤
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      supabase
        .from('users')
        .select('notifications_enabled, like_notifications_enabled, comment_notifications_enabled')
        .eq('id', user.id)
        .single()
        .then(({data}) => {
          if (data) updateUserProfile(data);
        });
    }, [user?.id]),
  );

  const handleToggleNotifications = async (value: boolean) => {
    if (!user || isUpdatingNotifications) return;
    setIsUpdatingNotifications(true);
    try {
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            '알림 권한 필요',
            '기기 설정에서 알림 권한을 허용해주세요.',
            [
              {text: '취소', style: 'cancel'},
              {text: '설정으로 이동', onPress: () => Linking.openSettings()},
            ],
          );
          return;
        }
        await registerDeviceToken(user.id);
      }

      const {error} = await supabase
        .from('users')
        .update({notifications_enabled: value})
        .eq('id', user.id);
      if (error) throw error;

      updateUserProfile({notifications_enabled: value});
      trackEvent('notifications_toggled', {enabled: value});
    } catch (error) {
      console.error('❌ 알림 설정 변경 실패:', error);
      Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleToggleLikeNotifications = async (value: boolean) => {
    if (!user || isUpdatingLikeNotifications) return;
    setIsUpdatingLikeNotifications(true);
    try {
      const {error} = await supabase
        .from('users')
        .update({like_notifications_enabled: value})
        .eq('id', user.id);
      if (error) throw error;

      updateUserProfile({like_notifications_enabled: value});
      trackEvent('like_notifications_toggled', {enabled: value});
    } catch (error) {
      console.error('❌ 좋아요 알림 설정 변경 실패:', error);
      Alert.alert('오류', '좋아요 알림 설정 변경에 실패했습니다.');
    } finally {
      setIsUpdatingLikeNotifications(false);
    }
  };

  const handleToggleCommentNotifications = async (value: boolean) => {
    if (!user || isUpdatingCommentNotifications) return;
    setIsUpdatingCommentNotifications(true);
    try {
      const {error} = await supabase
        .from('users')
        .update({comment_notifications_enabled: value})
        .eq('id', user.id);
      if (error) throw error;

      updateUserProfile({comment_notifications_enabled: value});
      trackEvent('comment_notifications_toggled', {enabled: value});
    } catch (error) {
      console.error('❌ 댓글 알림 설정 변경 실패:', error);
      Alert.alert('오류', '댓글 알림 설정 변경에 실패했습니다.');
    } finally {
      setIsUpdatingCommentNotifications(false);
    }
  };

  const handleUpdatePress = async () => {
    if (versionStatus !== 'update') return;
    trackEvent('settings_update_clicked');
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
    navigation.navigate(MY_PAGE_ROUTES.TERMS_OF_SERVICE);
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate(MY_PAGE_ROUTES.PRIVACY_POLICY);
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(provider);
      trackEvent('account_deleted', {provider});
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

  const notificationsOn = user?.notifications_enabled ?? true;

  return (
    <S.Container>
      <S.ScrollView contentContainerStyle={{paddingVertical: 16, gap: 8}}>
        <S.SectionLabel>알림</S.SectionLabel>
        <S.MenuSection>
          <S.MenuItem activeOpacity={1}>
            <S.MenuTextColumn>
              <S.MenuText>알림 받기</S.MenuText>
              <S.MenuSubText>뜨지 소식, 내 활동에 대한 알림을 받을 수 있어요</S.MenuSubText>
            </S.MenuTextColumn>
            <Switch
              value={notificationsOn}
              onValueChange={handleToggleNotifications}
              disabled={isUpdatingNotifications}
              style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
            />
          </S.MenuItem>
          <S.MenuItem activeOpacity={1} style={{opacity: notificationsOn ? 1 : 0.4}}>
            <S.MenuTextColumn>
              <S.MenuText>좋아요 알림</S.MenuText>
              <S.MenuSubText>내 게시물에 좋아요가 눌리면 알림 받기</S.MenuSubText>
            </S.MenuTextColumn>
            <Switch
              value={user?.like_notifications_enabled ?? true}
              onValueChange={handleToggleLikeNotifications}
              disabled={!notificationsOn || isUpdatingLikeNotifications}
              style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
            />
          </S.MenuItem>
          <S.MenuItem activeOpacity={1} style={{opacity: notificationsOn ? 1 : 0.4}}>
            <S.MenuTextColumn>
              <S.MenuText>댓글 알림</S.MenuText>
              <S.MenuSubText>내 게시물/댓글에 댓글이 달리면 알림 받기</S.MenuSubText>
            </S.MenuTextColumn>
            <Switch
              value={user?.comment_notifications_enabled ?? true}
              onValueChange={handleToggleCommentNotifications}
              disabled={!notificationsOn || isUpdatingCommentNotifications}
              style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
            />
          </S.MenuItem>
        </S.MenuSection>

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
