// screens/Posts/PostsScreen.styles.ts

import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 양쪽 여백 16 + 중간 간격 16

export const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
  padding: 16px;
`;

export const ProfileSection = styled.View``;

export const LoadingContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const LoadingText = styled.Text`
  font-size: 14px;
  color: #999;
`;

export const EmptyContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
`;

export const EmptyIcon = styled.Text`
  font-size: 64px;
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

export const PostCard = styled.TouchableOpacity`
  //width: ${CARD_WIDTH}px;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`;

export const ImageContainer = styled.View`
  width: 100%;
  height: 200px;
  background-color: #f0f0f0;
  position: relative;
`;

export const PostImage = styled.View`
  //width: ${CARD_WIDTH}px;
  width: 200px;
  height: 200px;
`;

export const NoImageContainer = styled.View`
  width: 100%;
  height: 200px;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const NoImageText = styled.Text`
  font-size: 48px;
  opacity: 0.3;
`;

export const ImageCountBadge = styled.View`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 12px;
`;

export const ImageCountText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
`;

export const PostInfo = styled.View`
  padding: 12px;
  gap: 8px;
`;

export const PostTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #000;
  line-height: 20px;
`;

export const PostDate = styled.Text`
  font-size: 12px;
  color: #999;
`;

export const FloatingButton = styled.TouchableOpacity`
  position: absolute;
  right: 20px;
  bottom: 80px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #0070f3;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`;

export const FloatingButtonText = styled.Text`
  font-size: 32px;
  color: #ffffff;
  font-weight: 300;
  line-height: 36px;
`;
