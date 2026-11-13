import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const CARD_WIDTH = 136;
// 테두리(1px × 2)를 뺀 안쪽 너비 — FastImage는 % 크기를 못 잡아서 px로 고정
export const THUMBNAIL_WIDTH = CARD_WIDTH - 2;
export const THUMBNAIL_HEIGHT = 140;

export const Card = styled.TouchableOpacity`
  width: ${CARD_WIDTH}px;
  background-color: #fff;
  border-width: 1px;
  border-color: #eeeeee;
  border-radius: 14px;
  overflow: hidden;
`;

export const ThumbnailPlaceholder = styled.View`
  width: ${THUMBNAIL_WIDTH}px;
  height: ${THUMBNAIL_HEIGHT}px;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const Body = styled.View`
  width: ${THUMBNAIL_WIDTH}px;
  padding: 10px 10px 12px;
`;

export const Title = styled.Text`
  font-size: 14px;
  font-weight: 600;
  line-height: 19px;
  color: #111;
`;

export const OwnerRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
`;

export const OwnerAvatar = styled(FastImage)`
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: #e0e0e0;
`;

export const OwnerAvatarPlaceholder = styled.View`
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
`;

export const OwnerNickname = styled.Text`
  flex: 1;
  font-size: 12px;
  color: #888;
`;
