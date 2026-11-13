import React from 'react';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import * as S from './SavedProjectSearchCard.style';

interface SavedProjectSearchCardProps {
  ownerNickname: string;
  ownerAvatarUri: string | null;
  title: string;
  thumbnailUrl: string | null;
  onPress: () => void;
}

// 검색 화면 > 최근 뜨개함에 저장됐어요 (가로 스크롤용 세로형 카드)
export default function SavedProjectSearchCard({
  ownerNickname,
  ownerAvatarUri,
  title,
  thumbnailUrl,
  onPress,
}: SavedProjectSearchCardProps) {
  return (
    // 너비는 style로 직접 고정 — 작성자명이 길어도 카드가 늘어나지 않게
    <S.Card
      activeOpacity={0.75}
      onPress={onPress}
      style={{width: S.CARD_WIDTH, maxWidth: S.CARD_WIDTH}}>
      {thumbnailUrl ? (
        <FastImage
          source={{uri: thumbnailUrl}}
          resizeMode={FastImage.resizeMode.cover}
          style={{
            width: S.THUMBNAIL_WIDTH,
            height: S.THUMBNAIL_HEIGHT,
            backgroundColor: '#f0f0f0',
          }}
        />
      ) : (
        <S.ThumbnailPlaceholder>
          <Icon name="image" size={22} color="#ccc" />
        </S.ThumbnailPlaceholder>
      )}
      <S.Body>
        <S.Title numberOfLines={2}>{title}</S.Title>
        <S.OwnerRow>
          {ownerAvatarUri ? (
            <S.OwnerAvatar source={{uri: ownerAvatarUri}} />
          ) : (
            <S.OwnerAvatarPlaceholder>
              <Icon name="user" size={9} color="#ccc" />
            </S.OwnerAvatarPlaceholder>
          )}
          <S.OwnerNickname numberOfLines={1}>{ownerNickname}</S.OwnerNickname>
        </S.OwnerRow>
      </S.Body>
    </S.Card>
  );
}
