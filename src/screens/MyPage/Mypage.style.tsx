import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f8f8f8;
`;

export const ScrollView = styled.ScrollView`
  flex: 1;
`;

export const MenuSection = styled.View`
  background-color: #fff;
  border-radius: 12px;
  margin: 16px 16px 0;
  overflow: hidden;
`;

export const MenuItem = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const MenuText = styled.Text`
  font-size: 16px;
  color: #191919;
`;

export const MenuArrow = styled.Text`
  font-size: 20px;
  color: #ccc;
`;

export const MenuValue = styled.Text`
  font-size: 14px;
  color: #999;
`;

export const LogoutMenuItem = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
`;

export const LogoutText = styled.Text`
  font-size: 16px;
  color: #e53935;
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
