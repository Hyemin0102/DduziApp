import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f5f5f5;
`;

export const ScrollView = styled.ScrollView`
  flex: 1;
`;

export const MenuSection = styled.View`
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
`;

export const MenuItem = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const MenuText = styled.Text`
  font-size: 16px;
  color: #333;
`;

export const MenuArrow = styled.Text`
  font-size: 24px;
  color: #999;
`;

export const LogoutButton = styled.TouchableOpacity`
  background-color: #ff4444;
  border-radius: 12px;
  padding: 16px;
  align-items: center;
  margin-top: 8px;
`;

export const LogoutButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

export const DeleteButton = styled.TouchableOpacity`
  border-radius: 12px;
  padding: 16px;
  align-items: center;
  margin-top: 8px;
`;

export const DeleteButtonText = styled.Text`
  color: #999;
  font-size: 14px;
  text-decoration-line: underline;
`;

export const CenterContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const ErrorText = styled.Text`
  font-size: 16px;
  color: #666;
`;
