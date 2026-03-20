import styled from '@emotion/native';

export const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const ModalContainer = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
`;

export const Title = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

export const Description = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  line-height: 20px;
`;

export const VisibilitySection = styled.View`
  margin-bottom: 24px;
`;

export const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
`;

export const VisibilityOption = styled.TouchableOpacity<{selected: boolean}>`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  border-width: 2px;
  border-color: ${props => (props.selected ? '#007AFF' : '#E5E5EA')};
  background-color: ${props => (props.selected ? '#F0F8FF' : '#fff')};
  margin-bottom: 12px;
`;

export const Radio = styled.View<{selected: boolean}>`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border-width: 2px;
  border-color: ${props => (props.selected ? '#007AFF' : '#C7C7CC')};
  background-color: #fff;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

export const RadioDot = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #007aff;
`;

export const OptionContent = styled.View`
  flex: 1;
`;

export const OptionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

export const OptionDescription = styled.Text`
  font-size: 13px;
  color: #666;
`;

export const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

export const CancelButton = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  background-color: #f2f2f7;
  align-items: center;
`;

export const CancelButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #666;
`;

export const ConfirmButton = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  background-color: #007aff;
  align-items: center;
`;

export const ConfirmButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;
