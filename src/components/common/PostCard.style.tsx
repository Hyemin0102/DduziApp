import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const CardContainer = styled.View`
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #efefef;
`;

export const ProfileSection = styled.TouchableOpacity`
  flex-direction: row;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
`;

export const ProfileImage = styled.Image`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border-width: 1px;
  border-color: #e9e9e7;
`;

export const ProfileImagePlaceholder = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f1f1ef;
  justify-content: center;
  align-items: center;
`;

export const ProfileImagePlaceholderText = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #191919;
`;

export const Username = styled.Text`
  font-weight: 600;
  font-size: 14px;
  color: #191919; 
  flex: 1;
`;

export const ImageContainer = styled.View`
  width:${`${SCREEN_WIDTH}px`};
  height:${`${SCREEN_WIDTH}px`};
  position: relative;
`;

export const PostImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const ImagePlaceholder = styled.View`
  width: 100%;
  height: 100%;
  background-color: #f1f1ef;
`;

export const ImageCounter = styled.View`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.55);
  padding: 4px 10px;
  border-radius: 12px;
`;

export const ImageCounterText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 600;
`;

export const DotsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 5px;
  padding-top: 8px;
`;

export const Dot = styled.View<{active: boolean}>`
  width: ${({active}) => (active ? 6 : 5)}px;
  height: ${({active}) => (active ? 6 : 5)}px;
  border-radius: 3px;
  background-color: ${({active}) => (active ? '#191919' : '#d4d4d4')};
`;

export const ContentSection = styled.TouchableOpacity`
  padding: 10px 12px 14px;
`;

export const BadgeRow = styled.View`
  flex-direction: row;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

export const ProjectBadge = styled.View`
  background-color: #f1f1ef;
  padding-horizontal: 8px;
  padding-vertical: 3px;
  border-radius: 10px;
  max-width: 160px;
`;

export const ProjectBadgeText = styled.Text`
  font-size: 12px;
  color: #191919;
  font-weight: 600;
`;

export const StatusBadge = styled.View<{completed: boolean}>`
  background-color: ${({completed}) => (completed ? '#e8f5e9' : '#fff8e1')};
  padding-horizontal: 8px;
  padding-vertical: 3px;
  border-radius: 10px;
`;

export const StatusBadgeText = styled.Text<{completed: boolean}>`
  font-size: 12px;
  color: ${({completed}) => (completed ? '#4CAF50' : '#f59e0b')};
  font-weight: 600;
`;

export const Content = styled.Text`
  font-size: 14px;
  color: #191919;
  line-height: 20px;
  margin-bottom: 6px;
`;

export const Date = styled.Text`
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
`;

export const More = styled.Text`
  font-size: 14px;
  color: #aaa;
  margin-bottom: 4px;
`;
