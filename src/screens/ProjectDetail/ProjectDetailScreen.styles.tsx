import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

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
  border-bottom-width: 6px;
  border-bottom-color: #f5f5f5;
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
  margin-bottom: 4px;
`;

export const BadgeRow = styled.View`
  flex-direction: row;
  gap: 6px;
  flex-wrap: wrap;
`;

export const StatusBadge = styled.View<{
  variant: 'progress' | 'completed' | 'public' | 'private';
}>`
  padding-horizontal: 10px;
  padding-vertical: 5px;
  border-radius: 12px;
  background-color: ${({variant}) => {
    switch (variant) {
      case 'progress':
        return '#fff8e1';
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
  font-weight: 600;
  color: ${({variant}) => {
    switch (variant) {
      case 'progress':
        return '#f59e0b';
      case 'completed':
        return '#4CAF50';
      case 'public':
        return '#1e88e5';
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
  font-size: 15px;
  color: #191919;
  line-height: 22px;
  text-decoration-line: underline;
  flex-shrink: 1;
`;

export const PlaceholderText = styled.Text`
  font-size: 15px;
  color: #bbb;
  line-height: 22px;
`;

export const LogItem = styled.View<{isEditable?: boolean}>`
  margin-bottom: 12px;
  background-color: ${({isEditable}) => (isEditable ? '#fff' : '#fafafa')};
  border-width: ${({isEditable}) => (isEditable ? '1px' : '0px')};
  border-color: #e5e5e5;
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

export const LogInputWrapper = styled.View<{isFocused: boolean}>`
  margin-top: 6px;
  background-color: ${({isFocused}) => (isFocused ? '#fff' : 'transparent')};
  border-radius: ${({isFocused}) => (isFocused ? '8px' : '0px')};
  border-width: ${({isFocused}) => (isFocused ? '1px' : '0px')};
  border-color: #e9e9e7;
  padding: ${({isFocused}) => (isFocused ? '8px' : '0px')};
`;

export const LogEditItem = styled.View`
  margin-bottom: 12px;
  background-color: #fff;
  border-width: 1px;
  border-color: #e5e5e5;
  padding: 12px;
  border-radius: 8px;
`;

export const LogEditHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const LogInput = styled.TextInput`
  font-size: 14px;
  color: #000;
`;

export const PostHeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const InfoHeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  //margin-bottom: 12px;
  margin-top: 20px;
`;

export const AddButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #191919;
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
  background-color: #191919;
  padding-horizontal: 20px;
  padding-vertical: 10px;
  border-radius: 20px;
`;

export const EmptyAddButtonText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
`;

export const PostCard = styled.View`
  background-color: #fafafa;
  border-radius: 12px;
  overflow: hidden;
`;

export const PostImageWrapper = styled.View<{width: number}>`
  width: ${({width}) => width}px;
  height: 220px;
  position: relative;
`;

export const PostImage = styled(FastImage)`
  width: 100%;
  height: 100%;
`;

export const PostImageCounter = styled.Text`
  position: absolute;
  bottom: 12px;
  right: 14px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 4px 10px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
`;

export const PostContent = styled.Text`
  font-size: 14px;
  color: #333;
  padding: 12px;
  padding-bottom: 10px;
  line-height: 20px;
`;

export const PostMore = styled.Text`
  font-size: 14px;
  color: #999;
  padding-horizontal: 12px;
  padding-bottom: 4px;
`;

export const PostDate = styled.Text`
  font-size: 12px;
  color: #999;
  padding-horizontal: 12px;
  padding-bottom: 10px;
`;

export const CompleteButton = styled.TouchableOpacity`
  margin: 20px;
  background-color: #191919;
  padding: 16px;
  border-radius: 12px;
  align-items: center;
`;

export const CompleteButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
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
  padding: 16px 20px;
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
  color: #191919;
  font-weight: 600;
  text-align: center;
`;

export const SubmitText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #191919;
`;

// ─── SNS 스타일 상단 영역 ─────────────────────────────────

export const PostArea = styled.View`
  padding: 20px 20px 16px;
  border-bottom-width: 6px;
  border-bottom-color: #f5f5f5;
  position: relative;
`;

export const PostAreaDivider = styled.View`
  height: 0.5px;
  background-color: #f0f0f0;
  margin-vertical: 12px;
`;

export const TitleInput = styled.TextInput`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  padding: 0;
  line-height: 28px;
`;

export const DescriptionInput = styled.TextInput`
  font-size: 15px;
  color: #333;
  line-height: 24px;
  min-height: 120px;
  padding: 0;
`;

// export const MetaRow = styled.View`
//   margin-top: 10px;
// `;

export const ActionSheetTrigger = styled.TouchableOpacity`
  position: absolute;
  top: 18px;
  right: 16px;
  padding: 4px;
`;

// ─── 상태 설정 섹션 (B 방식: 행 + 토글) ──────────────────

/**
 * 뜨개 상태 + 게시물 공개 여부를 담는 섹션
 * 각 항목은 MetaRowItem으로 구성
 */
export const MetaSection = styled.View`
  border-bottom-width: 6px;
  border-bottom-color: #f5f5f5;
  padding-horizontal: 20px;
`;

/** 각 설정 행: 라벨(왼쪽) + 컨트롤(오른쪽) */
export const MetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: 14px;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

/** 라벨 + 부연설명을 세로로 쌓는 왼쪽 영역 */
export const MetaRowLeft = styled.View`
  flex: 1;
`;

export const MetaRowTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #555;
`;

export const MetaRowSub = styled.Text`
  font-size: 12px;
  color: #bbb;
`;

// ─── 정보 섹션 (실·바늘·도안) ─────────────────────────────

export const InfoSection = styled.View`
  border-bottom-width: 6px;
  border-bottom-color: #f5f5f5;
  padding-horizontal: 20px;
  //background: yellow;
`;

export const InfoRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding-vertical: 14px;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

export const InfoIconBox = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const InfoIcon = styled.Text`
  font-size: 16px;
`;

export const InfoContent = styled.View`
  flex: 1;
`;

export const InfoLabel = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #999;
  margin-bottom: 3px;
`;

export const InfoValue = styled.Text`
  font-size: 14px;
  color: #333;
  line-height: 20px;
`;

export const InfoPlaceholder = styled.Text`
  font-size: 14px;
  color: #ccc;
`;

export const InfoInput = styled.TextInput`
  font-size: 14px;
  color: #333;
  padding: 0;
  line-height: 20px;
  //flex-wrap: wrap;
`;

export const LinkRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`;

// ─── 뜨개 로그 타임라인 ───────────────────────────────────

export const LogTimelineRow = styled.View`
  flex-direction: row;
`;

export const LogTimelineDotCol = styled.View`
  width: 20px;
  align-items: center;
`;

export const LogTimelineDot = styled.View<{active?: boolean}>`
  width: 9px;
  height: 9px;
  border-radius: 5px;
  background-color: ${({active}) => (active ? '#191919' : '#c8c8c8')};
  margin-top: 3px;
`;

export const LogTimelineLine = styled.View`
  flex: 1;
  width: 1.5px;
  background-color: #e5e5e5;
  margin-top: 6px;
  margin-bottom: 0px;
`;

export const LogTimelineContent = styled.View`
  flex: 1;
  padding-left: 10px;
  padding-bottom: 20px;
`;

export const LogTimelineDateRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

export const LogTimelineDate = styled.Text<{active?: boolean}>`
  font-size: 12px;
  font-weight: ${({active}) => (active ? '700' : '500')};
  color: ${({active}) => (active ? '#191919' : '#999')};
`;

// ─── 게시물 날짜 배지 ─────────────────────────────────────

export const PostDateRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 10px 12px 4px;
  gap: 6px;
`;

export const PostDateText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #191919;
`;

export const ViewAllButton = styled.TouchableOpacity`
  margin-top: 16px;
  padding-vertical: 11px;
  align-items: center;
  border-radius: 10px;
  background-color: #f5f5f5;
`;

export const ViewAllButtonText = styled.Text`
  font-size: 13px;
  color: #555;
  font-weight: 600;
`;

export const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.35);
  justify-content: center;
  align-items: center;
  z-index: 999;
`;



export const LogActionRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
`;

export const LogSaveButton = styled.TouchableOpacity`
  padding: 4px 12px;
  background-color: #191919;
  border-radius: 6px;
`;

export const LogSaveText = styled.Text`
  font-size: 13px;
  color: #fff;
`;

export const LogCancelButton = styled.TouchableOpacity`
  padding: 4px 12px;
`;

export const LogCancelText = styled.Text`
  font-size: 13px;
  color: #999;
`;

export const LogIconRow = styled.View`
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

