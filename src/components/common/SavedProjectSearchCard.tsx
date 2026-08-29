import React from 'react';
import Icon from 'react-native-vector-icons/Feather';
import * as S from './SavedProjectSearchCard.style';

interface SavedProjectSearchCardProps {
  ownerNickname: string;
  ownerAvatarUri: string | null;
  title: string;
  dateLabel: string | null;
  thumbnailUrl: string | null;
  onPress: () => void;
}

export default function SavedProjectSearchCard({
  ownerNickname,
  ownerAvatarUri,
  title,
  dateLabel,
  thumbnailUrl,
  onPress,
}: SavedProjectSearchCardProps) {
  return (
    <S.Card activeOpacity={0.75} onPress={onPress}>
      <S.Left>
        <S.OwnerRow>
          {ownerAvatarUri ? (
            <S.OwnerAvatar source={{uri: ownerAvatarUri}} />
          ) : (
            <S.OwnerAvatarPlaceholder>
              <Icon name="user" size={10} color="#ccc" />
            </S.OwnerAvatarPlaceholder>
          )}
          <S.OwnerNickname numberOfLines={1}>{ownerNickname}</S.OwnerNickname>
        </S.OwnerRow>
        <S.Title numberOfLines={1}>{title}</S.Title>
        {dateLabel && <S.Date>{dateLabel}</S.Date>}
      </S.Left>
      <S.Right>
        {thumbnailUrl ? <S.Thumbnail source={{uri: thumbnailUrl}} /> : null}
        <Icon name="chevron-right" size={16} color="#ccc" />
      </S.Right>
    </S.Card>
  );
}
