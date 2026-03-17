import styled from '@emotion/native';

export const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const Section = styled.View`
  padding-horizontal: 20px;
  padding-vertical: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

export const Title = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #111;
  flex: 1;
  margin-right: 12px;
`;

export const Date = styled.Text`
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
`;

export const BadgeRow = styled.View`
  flex-direction: row;
  gap: 8px;
  flex-wrap: wrap;
`;

export const StatusBadge = styled.View<{
  variant: 'progress' | 'completed' | 'public' | 'private';
}>`
  align-self: flex-start;
  padding-horizontal: 10px;
  padding-vertical: 4px;
  border-radius: 12px;
  background-color: ${({variant}) => {
    switch (variant) {
      case 'progress':
        return '#f0ecff';
      case 'completed':
        return '#e8f5e9';
      case 'public':
        return '#e3f2fd';
      case 'private':
        return '#f5f5f5';
    }
  }};
`;

export const StatusText = styled.Text<{
  variant: 'progress' | 'completed' | 'public' | 'private';
}>`
  font-size: 13px;
  color: ${({variant}) => {
    switch (variant) {
      case 'progress':
        return '#6b4fbb';
      case 'completed':
        return '#4CAF50';
      case 'public':
        return '#1976D2';
      case 'private':
        return '#999';
    }
  }};
`;

export const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
`;

export const Body = styled.Text`
  font-size: 15px;
  color: #333;
  line-height: 22px;
`;

export const Link = styled.Text`
  color: #007aff;
`;

export const LogItem = styled.View`
  margin-bottom: 12px;
  background-color: #fafafa;
  padding: 12px;
  border-radius: 8px;
`;

export const LogDate = styled.Text`
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
`;

export const LogContent = styled.Text`
  font-size: 14px;
  color: #333;
  line-height: 20px;
`;

export const PostHeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const AddButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #6b4fbb;
  padding-horizontal: 12px;
  padding-vertical: 6px;
  border-radius: 16px;
  gap: 4px;
`;

export const AddButtonText = styled.Text`
  color: #fff;
  font-size: 13px;
  font-weight: 600;
`;

export const EmptyPosts = styled.View`
  align-items: center;
  padding-vertical: 24px;
  gap: 12px;
`;

export const EmptyText = styled.Text`
  font-size: 14px;
  color: #999;
`;

export const EmptyAddButton = styled.TouchableOpacity`
  background-color: #6b4fbb;
  padding-horizontal: 20px;
  padding-vertical: 10px;
  border-radius: 20px;
`;

export const EmptyAddButtonText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
`;

export const PostCard = styled.TouchableOpacity`
  margin-bottom: 16px;
  background-color: #fafafa;
  border-radius: 12px;
  overflow: hidden;
`;

export const ImageScroll = styled.ScrollView`
  height: 200px;
`;

export const PostImage = styled.Image`
  width: 200px;
  height: 200px;
  margin-right: 4px;
`;

export const PostContent = styled.Text`
  font-size: 14px;
  color: #333;
  padding: 12px;
  line-height: 20px;
`;

export const PostDate = styled.Text`
  font-size: 12px;
  color: #999;
  padding-horizontal: 12px;
  padding-bottom: 10px;
`;

export const CompleteButton = styled.TouchableOpacity`
  margin: 20px;
  background-color: #6b4fbb;
  padding: 16px;
  border-radius: 12px;
  align-items: center;
`;

export const CompleteButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

export const ProgressSection = styled.View`
  padding-horizontal: 20px;
  padding-vertical: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const ProgressLabelRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const ProgressLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #555;
`;

export const ProgressPercentText = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: #6b4fbb;
`;

export const ProgressDragHint = styled.Text`
  font-size: 12px;
  color: #bbb;
  margin-top: 8px;
  text-align: center;
`;

export const Overlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

export const ActionSheet = styled.View`
  background-color: #fff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding-bottom: 34px;
`;

export const ActionSheetHandle = styled.View`
  width: 40px;
  height: 4px;
  background-color: #ddd;
  border-radius: 2px;
  align-self: center;
  margin-top: 12px;
  margin-bottom: 8px;
`;

export const ActionSheetBtn = styled.TouchableOpacity`
  padding: 16px;
  padding-horizontal: 20px;
  flex-direction: row;
  align-items: center;
`;

export const ActionSheetIcon = styled.Text`
  font-size: 20px;
  margin-right: 12px;
`;

export const ActionSheetText = styled.Text`
  font-size: 17px;
  color: #000;
`;

export const ActionSheetDivider = styled.View`
  height: 1px;
  background-color: #eee;
  margin-horizontal: 20px;
`;

export const DestructiveText = styled.Text`
  font-size: 17px;
  color: #ff3b30;
`;

export const CancelBtn = styled.TouchableOpacity`
  border-top-width: 8px;
  border-top-color: #f5f5f5;
  justify-content: center;
  padding: 16px;
`;

export const CancelText = styled.Text`
  font-size: 17px;
  color: #007aff;
  font-weight: 600;
  text-align: center;
`;
