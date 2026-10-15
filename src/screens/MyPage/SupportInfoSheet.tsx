import React from 'react';
import {View} from 'react-native';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import AvatarLevelBadge from '@/components/common/AvatarLevelBadge';
import * as S from './SupportScreen.styles';
import {SUPPORT_PRICE_LABEL} from '@/constants/support.constant';

const BADGE_GUIDE = [
  {level: 1 as const, label: '1회 응원'},
  {level: 2 as const, label: '2회 응원'},
  {level: 3 as const, label: '3회 이상'},
];

interface SupportInfoSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function SupportInfoSheet({visible, onClose}: SupportInfoSheetProps) {
  return (
    <ActionSheetModal visible={visible} onClose={onClose} showCancel={false}>
      <View style={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32}}>
        <S.Title>뜨지를 응원해주세요!</S.Title>
        <S.Body>
          뜨지는 뜨사장 혼자 운영하고 있는 앱이예요. 여러분의 응원은 광고 없는 앱과 서버 운영에 큰 도움이 됩니다.
        </S.Body>

        <S.BulletRow>
          <S.BulletDot>•</S.BulletDot>
          <S.Body style={{flex: 1}}>응원 금액: {SUPPORT_PRICE_LABEL} (1회 결제 기준)</S.Body>
        </S.BulletRow>
        <S.BulletRow>
          <S.BulletDot>•</S.BulletDot>
          <S.Body style={{flex: 1}}>응원 횟수에 따라 뜨지 뱃지를 받을 수 있어요.</S.Body>
        </S.BulletRow>
        <S.BulletRow>
          <S.BulletDot>•</S.BulletDot>
          <S.Body style={{flex: 1}}>뱃지는 프로필과 게시물에 함께 보여요. 원하지 않으면 끌 수 있어요.</S.Body>
        </S.BulletRow>

        <S.BadgeShowcase>
          {BADGE_GUIDE.map(item => (
            <S.BadgeItem key={item.level}>
              <AvatarLevelBadge size={96} level={item.level}>
                <S.AvatarPreview />
              </AvatarLevelBadge>
              <S.BadgeItemLabel>{item.label}</S.BadgeItemLabel>
            </S.BadgeItem>
          ))}
        </S.BadgeShowcase>
      </View>
    </ActionSheetModal>
  );
}
