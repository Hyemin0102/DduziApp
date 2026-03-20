import styled from '@emotion/native';

export const CardContainer = styled.View`
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

export const ProfileSection = styled.TouchableOpacity`
  flex-direction: row;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
`;

export const ProfileImage = styled.Image`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

export const Username = styled.Text`
  font-weight: bold;
  font-size: 16px;
  color: #333;
`;

export const ImageContainer = styled.View`
  height: 200px;
  position: relative;
`;

export const PostImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const ImagePlaceholder = styled.View`
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
`;

export const ImageCounter = styled.Text`
  position: absolute;
  bottom: 16px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 16px;
  color: #ffffff;
  font-size: 12px;
`;

export const ContentSection = styled.View`
  margin-top: 12px;
`;

export const Content = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 20px;
  margin-bottom: 8px;
`;

export const Date = styled.Text`
  font-size: 12px;
  color: #999;
`;

export const BadgeRow = styled.View`
  flex-direction: row;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

export const ProjectBadge = styled.View`
  background-color: #f0ecff;
  padding-horizontal: 8px;
  padding-vertical: 3px;
  border-radius: 10px;
  max-width: 160px;
`;

export const ProjectBadgeText = styled.Text`
  font-size: 12px;
  color: #6b4fbb;
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
