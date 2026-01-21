// components/CompletePostModal.tsx

import styled from "@emotion/native";
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';



interface CompletePostModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (visibility: 'public' | 'private') => Promise<void>;
  loading?: boolean;
}

const CompletePostModal: React.FC<CompletePostModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [selectedVisibility, setSelectedVisibility] =
    useState<'public' | 'private'>('public');

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
          <S.Description>
            작성한 내용이 저장되고 완료 처리됩니다.
          </S.Description>

          {/* 공개/비공개 선택 */}
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
                <S.OptionDescription>
                  모든 사용자에게 공개됩니다
                </S.OptionDescription>
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
                <S.OptionDescription>
                  나만 볼 수 있습니다
                </S.OptionDescription>
              </S.OptionContent>
            </S.VisibilityOption>
          </S.VisibilitySection>

          {/* 버튼 */}
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

const S = {
  Overlay: styled.View`
    flex: 1;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    padding: 20px;
  `,
  ModalContainer: styled.View`
    background-color: #fff;
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
  `,
  Title: styled.Text`
    font-size: 20px;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
  `,
  Description: styled.Text`
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
    line-height: 20px;
  `,
  VisibilitySection: styled.View`
    margin-bottom: 24px;
  `,
  SectionTitle: styled.Text`
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  `,
  VisibilityOption: styled.TouchableOpacity<{selected: boolean}>`
    flex-direction: row;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    border-width: 2px;
    border-color: ${props => (props.selected ? '#007AFF' : '#E5E5EA')};
    background-color: ${props => (props.selected ? '#F0F8FF' : '#fff')};
    margin-bottom: 12px;
  `,
  Radio: styled.View<{selected: boolean}>`
    width: 24px;
    height: 24px;
    border-radius: 12px;
    border-width: 2px;
    border-color: ${props => (props.selected ? '#007AFF' : '#C7C7CC')};
    background-color: #fff;
    justify-content: center;
    align-items: center;
    margin-right: 12px;
  `,
  RadioDot: styled.View`
    width: 12px;
    height: 12px;
    border-radius: 6px;
    background-color: #007AFF;
  `,
  OptionContent: styled.View`
    flex: 1;
  `,
  OptionTitle: styled.Text`
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  `,
  OptionDescription: styled.Text`
    font-size: 13px;
    color: #666;
  `,
  ButtonRow: styled.View`
    flex-direction: row;
    gap: 12px;
  `,
  CancelButton: styled.TouchableOpacity`
    flex: 1;
    padding: 16px;
    border-radius: 12px;
    background-color: #F2F2F7;
    align-items: center;
  `,
  CancelButtonText: styled.Text`
    font-size: 16px;
    font-weight: 600;
    color: #666;
  `,
  ConfirmButton: styled.TouchableOpacity`
    flex: 1;
    padding: 16px;
    border-radius: 12px;
    background-color: #007AFF;
    align-items: center;
  `,
  ConfirmButtonText: styled.Text`
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  `,
};

export default CompletePostModal;