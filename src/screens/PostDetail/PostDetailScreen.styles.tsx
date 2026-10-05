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

// 신고하기 등 완료될 때까지 화면 전체를 덮는 처리중 오버레이(PostCreateForProjectScreen과 동일 패턴)
export const ActionLoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
`;

export const ActionLoadingText = styled.Text`
  margin-top: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
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

export const ImageGalleryDivider = styled.View`
  height: 1px;
  background-color: #eeeeee;
  margin-bottom: 8px;
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
  padding: 10px 16px;
  background-color: #F8F8F7;
  border-radius: 12px;
  border-width: 1px;
  border-color: #e9e9e7;
`;

export const ProjectBannerLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

export const ProjectBannerDivider = styled.View`
  width: 1px;
  align-self: stretch;
  margin: 2px 12px;
  background-color: #e9e9e7;
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
`;

export const ProjectBannerRight = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const ProjectBannerChevron = styled.Text`
  font-size: 16px;
  color: #555;
`;

// 좋아요/댓글 액션 바
export const ActionBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 8px;
`;

export const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
`;

// 하트 버스트 파티클이 겹쳐 뜰 기준 위치(좋아요 아이콘 중심)
export const LikeIconWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

export const ActionButtonText = styled.Text`
  font-size: 14px;
  color: #000;
  font-weight: 600;
`;

// 댓글 바텀시트
export const CommentsSheetHeader = styled.View`
  align-items: center;
  padding-bottom: 12px;
  border-bottom-width: 1px;
  border-bottom-color: #eeeeee;
`;

export const CommentsSheetTitle = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: #000000;
`;

export const CommentsSheetList = styled.ScrollView`
  flex: 1;
  padding: 16px 20px 0 20px;
`;

export const CommentsEmptyText = styled.Text`
  font-size: 14px;
  color: #999;
  padding: 40px 0;
  text-align: center;
`;

export const CommentRow = styled.View`
  flex-direction: row;
  margin-bottom: 16px;
`;

export const CommentAvatar = styled(FastImage)`
  width: 32px;
  height: 32px;
  border-radius: 16px;
`;

export const CommentAvatarPlaceholder = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #f1f1ef;
  justify-content: center;
  align-items: center;
`;

export const CommentAvatarPlaceholderText = styled.Text`
  font-size: 13px;
  font-weight: bold;
  color: #555;
`;

export const CommentBody = styled.View`
  flex: 1;
  margin-left: 10px;
`;

export const CommentHeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const CommentHeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

export const CommentNickname = styled.Text`
  font-size: 13px;
  font-weight: bold;
  color: #000000;
`;

export const CommentTime = styled.Text`
  font-size: 12px;
  color: #999;
  margin-left: 8px;
`;

export const CommentMoreButton = styled.Text`
  font-size: 18px;
  color: #999;
  padding: 2px 8px;
`;

export const CommentContent = styled.Text`
  font-size: 14px;
  color: #333;
  line-height: 20px;
  margin-top: 4px;
`;

export const CommentMention = styled.Text`
  font-size: 14px;
  color: #3b82f6;
  font-weight: 600;
`;

export const CommentEditedMark = styled.Text`
  font-size: 11px;
  color: #aaa;
`;

export const CommentReplyButton = styled.TouchableOpacity`
  margin-top: 6px;
`;

export const CommentReplyButtonText = styled.Text`
  font-size: 12px;
  color: #999;
  font-weight: 600;
`;

export const ReplyingToChip = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f5f5;
  padding: 8px 16px;
`;

export const ReplyingToText = styled.Text`
  font-size: 12px;
  color: #666;
`;

export const ReplyingToCancel = styled.Text`
  font-size: 12px;
  color: #999;
  font-weight: 600;
`;

export const InputBar = styled.View`
  flex-direction: row;
  align-items: flex-end;
  padding: 10px 12px;
  background-color: #ffffff;
  border-top-width: 1px;
  border-top-color: #eeeeee;
`;

export const CommentInput = styled.TextInput`
  flex: 1;
  max-height: 100px;
  font-size: 14px;
  color: #000000;
  background-color: #f5f5f5;
  border-radius: 18px;
  padding: 10px 14px;
  margin-right: 8px;
`;

export const CommentSendButton = styled.TouchableOpacity<{disabled?: boolean}>`
  padding: 10px 4px;
  opacity: ${({disabled}) => (disabled ? 0.4 : 1)};
`;

export const CommentSendButtonText = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #191919;
`;

export const SaveToast = styled.TouchableOpacity`
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 24px;
  background-color: rgba(25, 25, 25, 0.95);
  border-radius: 12px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const SaveToastText = styled.Text`
  flex: 1;
  color: #fff;
  font-size: 14px;
  margin-right: 12px;
`;

export const SaveToastAction = styled.Text`
  color: #fff;
  font-size: 14px;
`;

// 콘텐츠 섹션
export const ContentSection = styled.View`
  padding: 0 20px 16px 20px;
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
