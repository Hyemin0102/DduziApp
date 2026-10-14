import React from 'react';
import Icon from 'react-native-vector-icons/Feather';
import AvatarLevelBadge from './AvatarLevelBadge';
import * as S from './SavedProjectCard.style';

interface SavedProjectCardProps {
  ownerNickname: string;
  ownerAvatarUri: string | null;
  ownerSupporterLevel?: 1 | 2 | 3 | null;
  ownerShowSupporterBadge?: boolean;
  title: string;
  dateLabel: string | null;
  thumbnailUrl: string | null;
  locked?: boolean;
  touchDisabled?: boolean;
  onPress: () => void;
  leftAccessory?: React.ReactNode;
}

export default function SavedProjectCard({
  ownerNickname,
  ownerAvatarUri,
  ownerSupporterLevel = null,
  ownerShowSupporterBadge = false,
  title,
  dateLabel,
  thumbnailUrl,
  locked = false,
  touchDisabled = false,
  onPress,
  leftAccessory,
}: SavedProjectCardProps) {
  return (
    <S.SavedCard activeOpacity={0.75} disabled={touchDisabled} onPress={onPress}>
      <S.SavedCardLeft>
        {leftAccessory}
        <AvatarLevelBadge
          size={36}
          level={ownerShowSupporterBadge ? ownerSupporterLevel : null}>
          {ownerAvatarUri ? (
            <S.OwnerAvatar source={{uri: ownerAvatarUri}} />
          ) : (
            <S.OwnerAvatarPlaceholder>
              <Icon name="user" size={14} color="#ccc" />
            </S.OwnerAvatarPlaceholder>
          )}
        </AvatarLevelBadge>
        <S.SavedCardInfo>
          <S.OwnerNickname numberOfLines={1}>{ownerNickname}</S.OwnerNickname>
          <S.SavedCardTitle numberOfLines={1} disabled={locked}>
            {title}
          </S.SavedCardTitle>
          {dateLabel && <S.CardDate>{dateLabel}</S.CardDate>}
        </S.SavedCardInfo>
      </S.SavedCardLeft>
      <S.SavedCardRight>
        {thumbnailUrl ? <S.CardThumbnail source={{uri: thumbnailUrl}} /> : null}
        {locked && <Icon name="lock" size={15} color="#ccc" />}
        <Icon name="chevron-right" size={16} color={locked ? '#ddd' : '#ccc'} />
      </S.SavedCardRight>
    </S.SavedCard>
  );
}
