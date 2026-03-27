import styled from '@emotion/native';
import {Dimensions} from 'react-native';
import FastImage from 'react-native-fast-image';

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
  color: #666;
`;

export const ErrorText = styled.Text`
  font-size: 16px;
  color: #666;
`;

// 작성자 섹션
export const AuthorSection = styled.TouchableOpacity`
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
  color: #666;
  padding: 8px;
`;

export const ProfileImage = styled(FastImage)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

export const ProfilePlaceholder = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #f1f1ef;
  justify-content: center;
  align-items: center;
`;

export const ProfilePlaceholderText = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #555;
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
  color: #666;
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

export const PostImage = styled(FastImage)`
  width: 100%;
  height: 100%;
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
  padding-vertical: 8px;
`;

export const Dot = styled.View<{active: boolean}>`
  width: ${({active}) => (active ? 6 : 5)}px;
  height: ${({active}) => (active ? 6 : 5)}px;
  border-radius: 3px;
  background-color: ${({active}) => (active ? '#191919' : '#d4d4d4')};
`;

// 프로젝트 링크 배너
export const ProjectBanner = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin: 0 16px 16px;
  padding: 12px 16px;
  background-color: #f1f1ef;
  border-radius: 12px;
  border-width: 1px;
  border-color: #e9e9e7;
`;

export const ProjectBannerLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

export const ProjectBannerLabel = styled.Text`
  font-size: 11px;
  color: #555;
  font-weight: 600;
  margin-bottom: 2px;
`;

export const ProjectBannerTitle = styled.Text`
  font-size: 14px;
  color: #191919;
  font-weight: 600;
`;

export const ProjectBannerTextGroup = styled.View`
  flex: 1;
  margin-left: 10px;
`;

export const ProjectBannerChevron = styled.Text`
  font-size: 16px;
  color: #555;
  margin-left: 8px;
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
  color: #333;
  line-height: 24px;
`;

export const PrivateBadge = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 4px 10px;
  margin-bottom: 12px;
`;

export const PrivateBadgeText = styled.Text`
  font-size: 12px;
  color: #888;
  font-weight: 600;
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
  color: #666;
  margin-bottom: 6px;
`;

export const InfoText = styled.Text`
  font-size: 16px;
  color: #000000;
  line-height: 22px;
`;

// 도안 섹션
export const PatternSection = styled.View``;

export const PatternImage = styled(FastImage)`
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
  background-color: ${props => (props.isFirst ? '#191919' : '#999')};
  border: 2px solid ${props => (props.isFirst ? '#191919' : '#e9e9e7')};
`;

export const TimelineLine = styled.View`
  position: absolute;
  left: 5px;
  top: 16px;
  bottom: -8px;
  width: 2px;
  background-color: #e9e9e7;
`;

// 로그 내용
export const LogContent = styled.View`
  background-color: #fafafa;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e9e9e7;
`;

export const LogDate = styled.Text`
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
`;

export const LogText = styled.Text`
  font-size: 14px;
  color: #333;
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
  color: #191919;
  font-weight: 600;
`;
