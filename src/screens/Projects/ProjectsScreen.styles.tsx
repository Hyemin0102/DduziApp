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

export const Summary = styled.View`
  flex-direction: row;
  padding-vertical: 28px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const SummaryItem = styled.View`
  flex: 1;
  align-items: center;
`;

export const SummaryDivider = styled.View`
  width: 1px;
  height: 32px;
  background-color: #eee;
`;

export const SummaryCount = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #191919;
`;

export const SummaryLabel = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 3px;
`;

export const Empty = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
`;

export const EmptyIcon = styled.Text`
  font-size: 64px;
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

export const Card = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: 16px;
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

export const StatusDot = styled.View<{completed: boolean}>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({completed}) => (completed ? '#4CAF50' : '#191919')};
`;

export const CardInfo = styled.View`
  flex: 1;
`;

export const CardTitle = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin-bottom: 4px;
`;

export const CardDate = styled.Text`
  font-size: 12px;
  color: #bbb;
`;

export const CardRight = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
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
      case 'progress':
        return '#f1f1ef';
      case 'completed':
        return '#e8f5e9';
      case 'public':
        return '#f1f1ef';
      case 'private':
        return '#f5f5f5';
    }
  }};
  color: ${({variant}) => {
    switch (variant) {
      case 'progress':
        return '#191919';
      case 'completed':
        return '#4CAF50';
      case 'public':
        return '#555';
      case 'private':
        return '#999';
    }
  }};
`;

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
