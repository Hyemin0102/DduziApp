import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const Empty = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 40px;
`;

export const EmptyIcon = styled.Image`
  width: 160px;
  height: 160px;
  margin-bottom: 8px;
`;

export const EmptyText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

export const EmptySubText = styled.Text`
  font-size: 14px;
  color: #999;
`;

export const Row = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  border-bottom-width: 1px;
  border-bottom-color: #f5f5f5;
`;

export const Thumbnail = styled(FastImage)`
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background-color: #f5f5f5;
`;

export const ThumbnailPlaceholder = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const Body = styled.View`
  flex: 1;
  gap: 2px;
`;

export const CommentText = styled.Text`
  font-size: 14px;
  color: #191919;
`;

export const PostPreview = styled.Text`
  font-size: 12px;
  color: #999;
`;

export const Time = styled.Text`
  font-size: 12px;
  color: #bbb;
`;
