// screens/Posts/PostsScreen.styles.ts

import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 양쪽 여백 16 + 중간 간격 16

export const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;

`;

export const ProfileSection = styled.View`
 padding: 16px;
`;

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

export const PostCard = styled.View`
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 4px;
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

export const PostInfo = styled.TouchableOpacity`
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

export const TabContainer = styled.View`
  flex-direction: row;
    border-bottom-width: 1px;
    border-bottom-color: #eee;
`;

export const Tab = styled.TouchableOpacity<{active: boolean}>`
    flex: 1;
    padding: 16px;
    align-items: center;
    position: relative;
`;


export const TabText = styled.Text<{active: boolean}>`
    font-size: 16px;
    font-weight: ${props => (props.active ? '700' : '400')};
    color: ${props => (props.active ? '#333' : '#999')};
`;

export const TabIndicator = styled.View`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #000;
`;

export const TabRow= styled.View`
    flex-direction: row;
`;

export const  ViewModeToggle= styled.View`

flex-direction: row;
gap: 8px;
`;

export const  ViewModeButton= styled.TouchableOpacity<{active: boolean}>`
padding: 8px;
border-radius: 8px;
background-color: ${props => (props.active ? '#F0F8FF' : 'transparent')};
`;

export const GridItem= styled.TouchableOpacity`
width: 100%;
height: 100%;
position: relative;
`;

export const GridImage= styled.Image`
width: 100%;
height: 100%;
`;

export const GridNoImage= styled.View`
width: 100%;
height: 100%;
background-color: #f5f5f5;
justify-content: center;
align-items: center;
`;

export const GridNoImageText= styled.Text`
font-size: 32px;
`;

export const MultipleImageIcon=styled.View`
position: absolute;
top: 8px;
right: 8px;
background-color: rgba(0, 0, 0, 0.6);
padding: 4px;
border-radius: 4px;
`;
