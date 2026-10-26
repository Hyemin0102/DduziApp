import React, {useEffect, useState} from 'react';
import {Alert, Linking, Platform, Switch, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../contexts/AuthContext';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {MY_PAGE_ROUTES, TAB_ROUTES} from '@/constants/navigation.constant';
import * as S from './Mypage.style';
import {profileUrl} from '@/lib/imageTransform';
import {trackEvent} from '@/lib/mixpanel';
import {SUPPORT_PAYMENT_ENABLED} from '@/constants/support.constant';
import SupportInfoSheet from './SupportInfoSheet';
import BadgeVisibilityInfoSheet from './BadgeVisibilityInfoSheet';
import AvatarLevelBadge from '@/components/common/AvatarLevelBadge';
import {purchaseSupport} from '@/lib/iap';
import {supabase} from '@/lib/supabase';

const IOS_BUNDLE_ID = 'com.dduzi.app';
const ANDROID_PACKAGE_ID = 'com.dduziapp';

const Mypage = () => {
  const {user, logout, updateUserProfile} = useAuth();
  const {navigation} = useCommonNavigation();
  const [appStoreId, setAppStoreId] = useState<string | null>(null);
  const [showSupportInfo, setShowSupportInfo] = useState(false);
  const [showBadgeVisibilityInfo, setShowBadgeVisibilityInfo] = useState(false);
  const [isPurchasingSupport, setIsPurchasingSupport] = useState(false);
  const [isUpdatingBadge, setIsUpdatingBadge] = useState(false);

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
    navigation.navigate(MY_PAGE_ROUTES.FEEDBACK);
  };

  const handleSupportPurchase = async () => {
    if (!SUPPORT_PAYMENT_ENABLED || isPurchasingSupport) return;
    setIsPurchasingSupport(true);
    try {
      const result = await purchaseSupport();
      updateUserProfile({
        supporter_level: result.supporter_level,
        supporter_count: result.supporter_count,
      });
      Alert.alert('응원 완료', '뜨지를 응원해주셔서 감사해요!');
    } catch (error: any) {
      if (error?.code === 'USER_CANCELLED') return;
      console.error('❌ 응원 결제 실패:', error);
      Alert.alert('오류', error?.message ?? '결제 중 문제가 발생했어요.');
    } finally {
      setIsPurchasingSupport(false);
    }
  };

  const handleToggleBadge = async (value: boolean) => {
    if (!user || isUpdatingBadge) return;
    setIsUpdatingBadge(true);
    try {
      const {error} = await supabase
        .from('users')
        .update({show_supporter_badge: value})
        .eq('id', user.id);
      if (error) throw error;

      updateUserProfile({show_supporter_badge: value});
      trackEvent('supporter_badge_visibility_toggled', {enabled: value});
    } catch (error) {
      console.error('❌ 뱃지 노출 설정 실패:', error);
      Alert.alert('오류', '설정을 변경하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsUpdatingBadge(false);
    }
  };

  const handleLikedPosts = () => {
    navigation.navigate(MY_PAGE_ROUTES.LIKED_POSTS);
  };

  const handleMyComments = () => {
    navigation.navigate(MY_PAGE_ROUTES.MY_COMMENTS);
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

  //const supportCount = 1;
   const supportCount = user.supporter_count ?? 0;
  const hasBadge = !!user.supporter_level;
  const showBadge = hasBadge && !!user.show_supporter_badge;

  return (
    <S.Container>
      <S.ScrollView>
        <S.ProfileCard onPress={handleProfile}>
          <AvatarLevelBadge size={60} level={user.supporter_level}>
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
          </AvatarLevelBadge>
          <S.ProfileInfo>
            <S.ProfileNameRow>
              <S.ProfileName>{user.nickname ?? '이름 없음'}</S.ProfileName>
            </S.ProfileNameRow>
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

        <S.SectionLabelRow onPress={() => setShowSupportInfo(true)}>
          <S.SectionLabelText>뜨지 응원</S.SectionLabelText>
          <Icon name="info" size={13} color="#000" />
        </S.SectionLabelRow>
        <S.MenuSection style={{marginTop: 4}}>
          <S.MenuItem activeOpacity={1}>
            <S.MenuLabelRow>
              <S.MenuText>뱃지 보여주기</S.MenuText>
              <TouchableOpacity
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                onPress={() => setShowBadgeVisibilityInfo(true)}>
                <Icon name="info" size={13} color="#999" />
              </TouchableOpacity>
            </S.MenuLabelRow>
            <Switch
              value={showBadge}
              onValueChange={handleToggleBadge}
              disabled={!hasBadge || isUpdatingBadge}
              style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
            />
          </S.MenuItem>
          <S.MenuItem
            onPress={handleSupportPurchase}
            disabled={!SUPPORT_PAYMENT_ENABLED || isPurchasingSupport}
            activeOpacity={SUPPORT_PAYMENT_ENABLED ? 0.7 : 1}>
            <S.MenuLabelRow>
              <S.MenuText>응원하기</S.MenuText>
              {supportCount > 0 && (
                <S.SupportCountBadge active>
                  <MaterialCommunityIcon
                    name="star-shooting-outline"
                    size={13}
                    color="#fff"
                  />
                  <S.SupportCountBadgeText active>
                    {supportCount}회 응원
                  </S.SupportCountBadgeText>
                </S.SupportCountBadge>
              )}
            </S.MenuLabelRow>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
        </S.MenuSection>

        <S.SectionLabel>내 활동</S.SectionLabel>
        <S.MenuSection style={{marginTop: 4}}>
          <S.MenuItem onPress={handleLikedPosts}>
            <S.MenuText>좋아요</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
          <S.MenuItem onPress={handleMyComments}>
            <S.MenuText>댓글</S.MenuText>
            <S.MenuArrow>›</S.MenuArrow>
          </S.MenuItem>
        </S.MenuSection>

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
      <SupportInfoSheet
        visible={showSupportInfo}
        onClose={() => setShowSupportInfo(false)}
      />
      <BadgeVisibilityInfoSheet
        visible={showBadgeVisibilityInfo}
        onClose={() => setShowBadgeVisibilityInfo(false)}
      />
    </S.Container>
  );
};

export default Mypage;
