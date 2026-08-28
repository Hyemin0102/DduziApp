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

/* ─── Summary (탭 역할 겸) ─── */

export const Summary = styled.View`
  flex-direction: row;
  padding-vertical: 24px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const SummaryItem = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
`;

export const SummaryDivider = styled.View`
  width: 1px;
  height: 32px;
  background-color: #eee;
  align-self: center;
`;

export const SummaryCount = styled.Text<{active: boolean}>`
  font-size: 22px;
  font-weight: 700;
  color: ${({active}) => (active ? '#191919' : '#ccc')};
`;

export const SummaryLabel = styled.Text<{active: boolean}>`
  font-size: 12px;
  color: ${({active}) => (active ? '#191919' : '#ccc')};
  margin-top: 3px;
`;

/* ─── Empty ─── */

export const Empty = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const EmptyIcon = styled.Image`
  width: 160px;
  height: 160px;
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

export const EmptyButton = styled.TouchableOpacity`
  margin-top: 8px;
  background-color: #191919;
  padding-horizontal: 28px;
  padding-vertical: 12px;
  border-radius: 24px;
`;

export const EmptyButtonText = styled.Text`
  color: #fff;
  font-size: 15px;
  font-weight: 600;
`;

/* ─── 내 프로젝트 카드 ─── */

export const Card = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: 20px;
  padding-vertical: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
  background-color: #fff;
`;

export const CardLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  gap: 12px;
`;

export const CardThumbnail = styled(FastImage)`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: #f0f0f0;
  flex-shrink: 0;
`;

export const CardInfo = styled.View`
  flex: 1;
`;

export const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const CardTitle = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #111;
`;

export const CardDate = styled.Text`
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
`;

export const CardRight = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
`;

/* ─── 편집 모드 ─── */

export const SelectCircle = styled.View<{selected: boolean}>`
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border-width: 1.5px;
  border-color: ${({selected}) => (selected ? '#191919' : '#ccc')};
  background-color: ${({selected}) => (selected ? '#191919' : 'transparent')};
  align-items: center;
  justify-content: center;
`;

export const SavedHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px;
`;

export const SavedHeaderTitle = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #191919;
`;

export const SavedHeaderAction = styled.TouchableOpacity``;

export const SavedHeaderActionText = styled.Text`
  font-size: 14px;
  color: #555;
`;

/* ─── 하단 플로팅 바 ─── */

export const FloatingBar = styled.View`
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const FloatingCancelButton = styled.TouchableOpacity`
  flex: 1;
  padding: 16px 20px;
  border-radius: 12px;
  background-color: #f1f1ef;
  align-items: center;
`;

export const FloatingCancelText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #555;
`;

export const FloatingDeleteButton = styled.TouchableOpacity<{disabled?: boolean}>`
  flex: 1;
  padding: 16px 20px;
  border-radius: 12px;
  background-color: #191919;
  align-items: center;
  opacity: ${({disabled}) => (disabled ? 0.4 : 1)};
`;

export const FloatingDeleteText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

/* ─── 삭제 확인 모달 ─── */

export const ConfirmOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const ConfirmModalContainer = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
`;

export const ConfirmTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #191919;
  margin-bottom: 8px;
`;

export const ConfirmDescription = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 20px;
  margin-bottom: 24px;
`;

export const ConfirmButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

export const ConfirmCancelButton = styled.TouchableOpacity`
  flex: 1;
  padding-vertical: 14px;
  border-radius: 10px;
  background-color: #f1f1ef;
  align-items: center;
`;

export const ConfirmCancelText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #555;
`;

export const ConfirmDeleteButton = styled.TouchableOpacity`
  flex: 1;
  padding-vertical: 14px;
  border-radius: 10px;
  background-color: #191919;
  align-items: center;
`;

export const ConfirmDeleteText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

/* ─── 비공개 섹션 ─── */

export const SectionDivider = styled.View`
  height: 8px;
  background-color: #f5f5f5;
  margin-top: 8px;
`;

export const SectionHeader = styled.Text`
  font-size: 12px;
  color: #999;
  font-weight: 600;
  padding: 14px 20px 8px;
`;

/* ─── 새 프로젝트 버튼 ─── */

export const AddButton = styled.TouchableOpacity`
  margin: 24px 16px;
  padding-vertical: 16px;
  border-radius: 14px;
  background-color: #000;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const AddButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

/* 기존 코드와의 호환성 */
export const StatusDot = styled.View<{completed: boolean}>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({completed}) => (completed ? '#4CAF50' : '#f59e0b')};
`;

export const StatusBadge = styled.Text<{
  variant: 'progress' | 'completed' | 'public' | 'private';
}>`
  font-size: 11px;
  font-weight: 600;
  padding-horizontal: 8px;
  padding-vertical: 3px;
  border-radius: 10px;
  background-color: ${({variant}) => {
    switch (variant) {
      case 'progress': return '#fff8e1';
      case 'completed': return '#e8f5e9';
      case 'public': return '#e3f2fd';
      case 'private': return '#f5f5f5';
    }
  }};
  color: ${({variant}) => {
    switch (variant) {
      case 'progress': return '#f59e0b';
      case 'completed': return '#4CAF50';
      case 'public': return '#1e88e5';
      case 'private': return '#999';
    }
  }};
`;
