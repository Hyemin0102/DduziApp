import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const SavedCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: 20px;
  padding-vertical: 14px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
  background-color: #fff;
`;

export const SavedCardLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  gap: 10px;
`;

export const SavedCardRight = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
`;

export const SavedCardInfo = styled.View`
  flex: 1;
`;

export const OwnerNickname = styled.Text`
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
`;

export const SavedCardTitle = styled.Text<{disabled?: boolean}>`
  font-size: 15px;
  font-weight: 600;
  color: ${({disabled}) => (disabled ? '#bbb' : '#111')};
`;

export const CardDate = styled.Text`
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
`;

export const CardThumbnail = styled(FastImage)`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: #f0f0f0;
  flex-shrink: 0;
`;

export const OwnerAvatar = styled(FastImage)`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #e0e0e0;
`;

export const OwnerAvatarPlaceholder = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
`;
