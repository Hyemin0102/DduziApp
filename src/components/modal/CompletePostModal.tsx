// components/CompletePostModal.tsx

import React, {useState} from 'react';
import {Modal, ActivityIndicator} from 'react-native';
import * as S from './CompletePostModal.style';

interface CompletePostModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (visibility: 'public' | 'private') => Promise<void>;
  loading?: boolean;
  initialVisibility?: 'public' | 'private';
}

const CompletePostModal: React.FC<CompletePostModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
  initialVisibility = 'public',
}) => {
  const [selectedVisibility, setSelectedVisibility] =
    useState<'public' | 'private'>(initialVisibility);

  React.useEffect(() => {
    if (visible) {
      setSelectedVisibility(initialVisibility);
    }
  }, [visible, initialVisibility]);

  const handleConfirm = async () => {
    await onConfirm(selectedVisibility);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <S.Overlay>
        <S.ModalContainer>
          <S.Title>프로젝트를 완료하시겠어요?</S.Title>
          <S.Description>작성한 내용이 저장되고 완료 처리됩니다.</S.Description>

          <S.VisibilitySection>
            <S.SectionTitle>공개 설정</S.SectionTitle>

            <S.VisibilityOption
              selected={selectedVisibility === 'public'}
              onPress={() => setSelectedVisibility('public')}>
              <S.Radio selected={selectedVisibility === 'public'}>
                {selectedVisibility === 'public' && <S.RadioDot />}
              </S.Radio>
              <S.OptionContent>
                <S.OptionTitle>공개</S.OptionTitle>
                <S.OptionDescription>모든 사용자에게 공개됩니다</S.OptionDescription>
              </S.OptionContent>
            </S.VisibilityOption>

            <S.VisibilityOption
              selected={selectedVisibility === 'private'}
              onPress={() => setSelectedVisibility('private')}>
              <S.Radio selected={selectedVisibility === 'private'}>
                {selectedVisibility === 'private' && <S.RadioDot />}
              </S.Radio>
              <S.OptionContent>
                <S.OptionTitle>비공개</S.OptionTitle>
                <S.OptionDescription>나만 볼 수 있습니다</S.OptionDescription>
              </S.OptionContent>
            </S.VisibilityOption>
          </S.VisibilitySection>

          <S.ButtonRow>
            <S.CancelButton onPress={onClose} disabled={loading}>
              <S.CancelButtonText>취소</S.CancelButtonText>
            </S.CancelButton>

            <S.ConfirmButton onPress={handleConfirm} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <S.ConfirmButtonText>완료하기</S.ConfirmButtonText>
              )}
            </S.ConfirmButton>
          </S.ButtonRow>
        </S.ModalContainer>
      </S.Overlay>
    </Modal>
  );
};

export default CompletePostModal;
