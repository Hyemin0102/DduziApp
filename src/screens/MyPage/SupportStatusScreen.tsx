import React, {useCallback, useRef, useState} from 'react';
import {Alert, Switch} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import * as S from './SupportScreen.styles';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import KnitLevelBadge from '@/components/common/KnitLevelBadge';
import {trackEvent} from '@/lib/mixpanel';
import {getSupportMessage} from '@/constants/support.constant';

export default function SupportStatusScreen() {
  const {user, updateUserProfile, refreshUserProfile} = useAuth();
  const [isUpdatingBadge, setIsUpdatingBadge] = useState(false);
  const userId = user?.id;
  const refreshRef = useRef(refreshUserProfile);
  refreshRef.current = refreshUserProfile;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      refreshRef.current();
    }, [userId]),
  );

  const supportCount = user?.supporter_count ?? 0;
  const level = user?.supporter_level ?? null;
  const hasBadge = !!level;
  const showBadge = hasBadge && !!user?.show_supporter_badge;

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

  return (
    <S.Container contentContainerStyle={{flexGrow: 1}}>
      <S.Hero>
        {level ? (
          <KnitLevelBadge level={level} size={300} />
        ) : null}
       
        <S.HeroCount>
          응원 횟수 {supportCount}회
        </S.HeroCount>
        <S.HeroMessage>{getSupportMessage(supportCount)}</S.HeroMessage>
      </S.Hero>

      <S.ToggleCard style={{marginTop: 'auto'}}>
        <S.ToggleTextColumn>
          <S.ToggleTitle>뱃지 보여주기</S.ToggleTitle>
          <S.ToggleSubText>
            {hasBadge
              ? '켜면 프로필과 게시물에 뱃지가 보여요'
              : '응원하면 뱃지를 설정할 수 있어요'}
          </S.ToggleSubText>
        </S.ToggleTextColumn>
        <Switch
          value={showBadge}
          onValueChange={handleToggleBadge}
          disabled={!hasBadge || isUpdatingBadge}
          style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
        />
      </S.ToggleCard>
    </S.Container>
  );
}
