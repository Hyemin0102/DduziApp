import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const ActionSheetHandle = styled.View`
  width: 40px;
  height: 4px;
  background-color: #dddddd;
  border-radius: 2px;
  align-self: center;
  margin-top: 12px;
  margin-bottom: 8px;
`;

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

// 신고 처리 중 댓글 바텀시트 전체를 덮는 오버레이(PostCreateForProjectScreen과 동일 패턴)
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
