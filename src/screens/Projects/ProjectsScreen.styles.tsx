import styled from '@emotion/native';

export const Container = styled.View`
  flex: 1;
  background-color: #f8f8f8;
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const Summary = styled.View`
  flex-direction: row;
  background-color: #fff;
  margin-horizontal: 16px;
  margin-top: 16px;
  border-radius: 12px;
  padding-vertical: 16px;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
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
  font-size: 24px;
  font-weight: 700;
  color: #6b4fbb;
`;

export const SummaryLabel = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 2px;
`;

export const ListContent = styled.View`
  padding: 16px;
  gap: 10px;
`;

export const Empty = styled.View`
  align-items: center;
  justify-content: center;
  padding-top: 80px;
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
  background-color: #6b4fbb;
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
  background-color: #fff;
  border-radius: 12px;
  padding-horizontal: 16px;
  padding-vertical: 14px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`;

export const CardLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  gap: 12px;
`;

export const StatusDot = styled.View<{completed: boolean}>`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${({completed}) => (completed ? '#4CAF50' : '#6b4fbb')};
`;

export const CardInfo = styled.View`
  flex: 1;
`;

export const CardTitle = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin-bottom: 3px;
`;

export const CardDate = styled.Text`
  font-size: 12px;
  color: #999;
`;

export const CardRight = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
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
        return '#f0ecff';
      case 'completed':
        return '#e8f5e9';
      case 'public':
        return '#e3f2fd';
      case 'private':
        return '#f5f5f5';
    }
  }};
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

export const FAB = styled.TouchableOpacity`
  position: absolute;
  bottom: 28px;
  right: 20px;
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: #6b4fbb;
  align-items: center;
  justify-content: center;
  elevation: 6;
  shadow-color: #6b4fbb;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`;
