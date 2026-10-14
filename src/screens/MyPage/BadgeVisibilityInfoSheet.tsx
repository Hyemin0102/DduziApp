import React from 'react';
import {View} from 'react-native';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import * as S from './SupportScreen.styles';

interface BadgeVisibilityInfoSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function BadgeVisibilityInfoSheet({
  visible,
  onClose,
}: BadgeVisibilityInfoSheetProps) {
  return (
    <ActionSheetModal visible={visible} onClose={onClose} showCancel={false}>
      <View style={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32}}>
        <S.Title>뱃지 보여주기가 무엇인가요?</S.Title>
        <S.BulletRow>
          <S.BulletDot>•</S.BulletDot>
          <S.Body style={{flex: 1}}>
            뱃지를 보여주면 다른 사람에게도 내 프로필, 게시물, 댓글에 응원 뱃지가 보여요.
          </S.Body>
        </S.BulletRow>
        <S.BulletRow>
          <S.BulletDot>•</S.BulletDot>
          <S.Body style={{flex: 1}}>
            뱃지를 끄면 나에게만 보이고 다른 사람에게는 보이지 않아요.
          </S.Body>
        </S.BulletRow>
      </View>
    </ActionSheetModal>
  );
}
