import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const Card = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-width: 1px;
  border-color: #eeeeee;
  border-radius: 14px;
  padding: 14px;
  margin-horizontal: 20px;
  margin-bottom: 10px;
`;

export const Left = styled.View`
  flex: 1;
  margin-right: 12px;
`;

export const OwnerRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

export const OwnerAvatar = styled(FastImage)`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #e0e0e0;
`;

export const OwnerAvatarPlaceholder = styled.View`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
`;

export const OwnerNickname = styled.Text`
  font-size: 12px;
  color: #666;
  flex-shrink: 1;
`;

export const Title = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
  flex-shrink: 1;
`;

export const Date = styled.Text`
  font-size: 12px;
  color: #bbb;
`;

export const Right = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const Thumbnail = styled(FastImage)`
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background-color: #f0f0f0;
`;
