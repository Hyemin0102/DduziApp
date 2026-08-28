import React from 'react';
import {Modal, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as S from './UpdateModal.style';

interface UpdateModalProps {
  visible: boolean;
  forced: boolean;
  releaseNotes: string | null;
  onUpdate: () => void;
  onClose: () => void;
}

export default function UpdateModal({
  visible,
  forced,
  releaseNotes,
  onUpdate,
  onClose,
}: UpdateModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!forced) onClose();
      }}>
      <S.Overlay>
        <Pressable
          style={{position: 'absolute', inset: 0}}
          onPress={forced ? undefined : onClose}
        />
        <S.ModalContainer>
          {!forced && (
            <S.CloseButton onPress={onClose} hitSlop={10}>
              <Icon name="x" size={20} color="#999" />
            </S.CloseButton>
          )}
          <S.Title>새로운 업데이트가 있어요</S.Title>
          <S.Description>
            {releaseNotes || '더 나아진 뜨지를 만나보세요.'}
          </S.Description>
          <S.UpdateButton onPress={onUpdate} activeOpacity={0.8}>
            <S.UpdateButtonText>업데이트 하기</S.UpdateButtonText>
          </S.UpdateButton>
        </S.ModalContainer>
      </S.Overlay>
    </Modal>
  );
}
