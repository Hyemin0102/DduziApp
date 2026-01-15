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
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const AuthorInfo = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

export const MoreButton = styled.Text`
  font-size: 24px;
  color: #666666;
  padding: 8px;
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
  color: #ffffff;
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

// 뜨개질 일지 섹션
export const LogSection = styled.View`
  margin-top: 24px;
`;

export const LogTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 20px;
`;

// 타임라인
export const Timeline = styled.View`
  padding-left: 4px;
`;

export const TimelineItem = styled.View`
  position: relative;
  padding-left: 32px;
  padding-bottom: 24px;
`;

export const TimelineDot = styled.View<{isFirst: boolean}>`
  position: absolute;
  left: 0;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${props => (props.isFirst ? '#4F46E5' : '#9CA3AF')};
  border: 2px solid ${props => (props.isFirst ? '#4F46E5' : '#D1D5DB')};
`;

export const TimelineLine = styled.View`
  position: absolute;
  left: 5px;
  top: 16px;
  bottom: -8px;
  width: 2px;
  background-color: #e5e7eb;
`;

// 로그 내용
export const LogContent = styled.View`
  background-color: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

export const LogDate = styled.Text`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 600;
`;

export const LogText = styled.Text`
  font-size: 14px;
  color: #374151;
  line-height: 20px;
`;

// 액션시트 (바텀시트)
export const ActionSheetOverlay = styled.Pressable`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

export const ActionSheetContainer = styled.View`
  background-color: #ffffff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding-bottom: 34px;
`;

export const ActionSheetHandle = styled.View`
  width: 40px;
  height: 4px;
  background-color: #dddddd;
  border-radius: 2px;
  align-self: center;
  margin-top: 12px;
  margin-bottom: 8px;
`;

export const ActionSheetButton = styled.TouchableOpacity<{
  isDestructive?: boolean;
}>`
  padding: 16px 20px;
  flex-direction: row;
  align-items: center;
`;

export const ActionSheetButtonText = styled.Text<{isDestructive?: boolean}>`
  font-size: 17px;
  color: ${props => (props.isDestructive ? '#FF3B30' : '#000000')};
  margin-left: 12px;
`;

export const ActionSheetIcon = styled.Text`
  font-size: 20px;
`;

export const ActionSheetDivider = styled.View`
  height: 1px;
  background-color: #eeeeee;
  margin: 0 20px;
`;

export const ActionSheetCancelButton = styled.TouchableOpacity`
  padding: 16px 20px;
  align-items: center;
  border-top-width: 8px;
  border-top-color: #f5f5f5;
`;

export const ActionSheetCancelText = styled.Text`
  font-size: 17px;
  color: #007aff;
  font-weight: 600;
`;
