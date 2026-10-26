import React, {useState} from 'react';
import {ActivityIndicator, Alert} from 'react-native';
import AvatarLevelBadge from './AvatarLevelBadge';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import {trackEvent} from '@/lib/mixpanel';
import {useAuth} from '@/contexts/AuthContext';
import {profileUrl} from '@/lib/imageTransform';
import {purchaseSupport} from '@/lib/iap';
import {SUPPORT_PAYMENT_ENABLED} from '@/constants/support.constant';
import * as S from './SupportPromptModal.style';

interface SupportPromptModalProps {
  visible: boolean;
  onClose: () => void;
  stage?: 1 | 2 | 3;
}

export default function SupportPromptModal({
  visible,
  onClose,
  stage = 1,
}: SupportPromptModalProps) {
  const {user, updateUserProfile} = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const avatarUri = user?.profile_image
    ? profileUrl(user.profile_image) ?? user.profile_image
    : null;

  const handleConfirm = async () => {
    if (!SUPPORT_PAYMENT_ENABLED || isPurchasing) return;
    trackEvent('support_modal_confirmed');
    setIsPurchasing(true);
    try {
      const result = await purchaseSupport();
      updateUserProfile({
        supporter_level: result.supporter_level,
        supporter_count: result.supporter_count,
      });
      onClose();
      Alert.alert('응원 완료', '뜨지를 응원해주셔서 감사해요!');
    } catch (error: any) {
      if (error?.code === 'USER_CANCELLED') return;
      console.error('❌ 응원 결제 실패:', error);
      onClose();
      Alert.alert('오류', error?.message ?? '결제 중 문제가 발생했어요.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDismiss = () => {
    trackEvent('support_modal_dismissed');
    onClose();
  };

  return (
    <ActionSheetModal visible={visible} onClose={handleDismiss} showCancel={false}>
      <S.Container>
        <AvatarLevelBadge size={64} level={stage}>
          {avatarUri ? (
            <S.AvatarImage source={{uri: avatarUri}} />
          ) : (
            <S.AvatarPlaceholder>
              <S.AvatarPlaceholderText>
                {user?.nickname?.charAt(0) ?? '?'}
              </S.AvatarPlaceholderText>
            </S.AvatarPlaceholder>
          )}
        </AvatarLevelBadge>
        <S.Title>뜨지가 마음에 드셨다면,{'\n'}응원하고 프로필을 꾸며보세요!</S.Title>
        <S.Message>
          뜨지는 1인이 개발하는 앱이에요.{'\n'}광고 없이 운영하는 데 큰 힘이 돼요.
        </S.Message>
        <S.ButtonRow>
          <S.DismissButton onPress={handleDismiss} disabled={isPurchasing}>
            <S.DismissButtonText>다음에</S.DismissButtonText>
          </S.DismissButton>
          <S.ConfirmButton onPress={handleConfirm} disabled={isPurchasing}>
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <S.ConfirmButtonText>응원하러 가기</S.ConfirmButtonText>
            )}
          </S.ConfirmButton>
        </S.ButtonRow>
      </S.Container>
    </ActionSheetModal>
  );
}
