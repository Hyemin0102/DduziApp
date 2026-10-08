import React from 'react';
import SupporterBadge from './SupporterBadge';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {ROOT_ROUTES, TAB_ROUTES, MY_PAGE_ROUTES} from '@/constants/navigation.constant';
import {trackEvent} from '@/lib/mixpanel';
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
  const {rootNavigation} = useCommonNavigation<any>();

  const handleConfirm = () => {
    trackEvent('support_modal_confirmed');
    onClose();
    rootNavigation.navigate(ROOT_ROUTES.TAB_NAVIGATOR, {
      screen: TAB_ROUTES.MY_PAGE_TAB,
      params: {screen: MY_PAGE_ROUTES.SUPPORT_STATUS},
    });
  };

  const handleDismiss = () => {
    trackEvent('support_modal_dismissed');
    onClose();
  };

  return (
    <ActionSheetModal visible={visible} onClose={handleDismiss} showCancel={false}>
      <S.Container>
        <SupporterBadge level={stage} size={64} />
        <S.Title>뜨지가 마음에 드셨다면,{'\n'}응원해주실래요?</S.Title>
        <S.Message>
          뜨지는 1인이 개발하는 앱이에요.{'\n'}광고 없이 운영하는 데 큰 힘이 돼요.
        </S.Message>
        <S.ButtonRow>
          <S.DismissButton onPress={handleDismiss}>
            <S.DismissButtonText>다음에</S.DismissButtonText>
          </S.DismissButton>
          <S.ConfirmButton onPress={handleConfirm}>
            <S.ConfirmButtonText>응원하러 가기</S.ConfirmButtonText>
          </S.ConfirmButton>
        </S.ButtonRow>
      </S.Container>
    </ActionSheetModal>
  );
}
