import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const Container = styled.View`
  flex: 1;
  background-color: #ffffff;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
`;

export const LoadingText = styled.Text`
  margin-top: 12px;
  font-size: 16px;
  color: #666666;
`;

export const ErrorText = styled.Text`
  font-size: 16px;
  color: #666666;
`;

// 작성자 섹션
export const AuthorSection = styled.View`
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #eeeeee;
`;

export const AuthorInfo = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const ProfileImage = styled.Image`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

export const ProfilePlaceholder = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #e0e0e0;
  justify-content: center;
  align-items: center;
`;

export const ProfilePlaceholderText = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #666666;
`;

export const AuthorTextContainer = styled.View`
  margin-left: 12px;
  flex: 1;
`;

export const Username = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 2px;
`;

export const Date = styled.Text`
  font-size: 13px;
  color: #666666;
`;

// 이미지 갤러리
export const ImageGallery = styled.ScrollView`
  height: ${`${SCREEN_WIDTH}px`};
`;

export const ImageWrapper = styled.View`
  width: ${`${SCREEN_WIDTH}px`};
  height: ${`${SCREEN_WIDTH}px`};

  position: relative;
`;

export const PostImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const ImageCounter = styled.Text`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 16px;
`;

export const ImageCounterText = styled.Text`
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
`;

// 콘텐츠 섹션
export const ContentSection = styled.View`
  padding: 20px;
`;

export const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 12px;
  line-height: 32px;
`;

export const Content = styled.Text`
  font-size: 16px;
  color: #333333;
  line-height: 24px;
`;

export const Divider = styled.View`
  height: 1px;
  background-color: #eeeeee;
  margin: 24px 0;
`;

// 정보 섹션
export const InfoSection = styled.View``;

export const InfoTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 16px;
`;

export const InfoRow = styled.View`
  margin-bottom: 16px;
`;

export const InfoLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  margin-bottom: 6px;
`;

export const InfoText = styled.Text`
  font-size: 16px;
  color: #000000;
  line-height: 22px;
`;

// 도안 섹션
export const PatternSection = styled.View``;

export const PatternImage = styled.Image`
  width: 100%;
  height: ${SCREEN_WIDTH * 1.2}px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;
