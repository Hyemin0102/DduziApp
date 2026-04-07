import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

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

export const ProfileCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  border-radius: 16px;
  margin: 20px 16px 0;
  padding: 18px 16px;
`;

export const ProfileAvatar = styled(FastImage)`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #e0e0e0;
`;

export const ProfileAvatarPlaceholder = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #e0e0e0;
  justify-content: center;
  align-items: center;
`;

export const ProfileInfo = styled.View`
  flex: 1;
  margin-left: 14px;
`;

export const ProfileName = styled.Text`
  font-size: 17px;
  font-weight: 600;
  color: #191919;
`;

export const ProfileSubText = styled.Text`
  font-size: 13px;
  color: #999;
  margin-top: 3px;
`;

export const ProfileArrow = styled.Text`
  font-size: 22px;
  color: #ccc;
`;
