import styled from '@emotion/native';

export const Container = styled.View`
  padding: 8px 20px 28px;
  align-items: center;
`;

export const AvatarImage = styled.Image`
  width: 64px;
  height: 64px;
  border-radius: 32px;
`;

export const AvatarPlaceholder = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: #f1f1ef;
  justify-content: center;
  align-items: center;
`;

export const AvatarPlaceholderText = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #191919;
`;

export const Title = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #191919;
  text-align: center;
  margin-top: 16px;
`;

export const Message = styled.Text`
  font-size: 14px;
  color: #666;
  text-align: center;
  line-height: 20px;
  margin-top: 16px;
`;

export const ButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 20px;
  align-self: stretch;
`;

export const DismissButton = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-vertical: 14px;
  border-radius: 12px;
  background-color: #f5f5f5;
`;

export const DismissButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #666;
`;

export const ConfirmButton = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-vertical: 14px;
  border-radius: 12px;
  background-color: #191919;
`;

export const ConfirmButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;
