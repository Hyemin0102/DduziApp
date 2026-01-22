import styled from '@emotion/native';

export const Container = styled.View`
    flex-direction: row;
      
`;

export const Wrapper = styled.View`
  flex-direction: row;
  padding-vertical: 20px;
  align-items: center;
`;

export const ProfileImage = styled.Image`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  border-width: 1px;
  border-color: #dde1e9;
  margin-right: 16px;
`;

export const ProfileImagePlaceholder = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #e0e0e0;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`;

export const ProfileImagePlaceholderText = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: #666;
`;

export const InfoContainer = styled.View`
  //flex: 1;
`;

export const Name = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`;

export const Email = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

export const ProviderBadge = styled.View`
  align-self: flex-start;
  padding-horizontal: 10px;
  padding-vertical: 4px;
  border-radius: 12px;
`;

export const ProviderText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #333;
`;

export const EditProfileButton = styled.TouchableOpacity`
  padding-horizontal: 16px;
  padding-vertical: 8px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #dde1e9;
  background-color: #fff;
  justify-content: center;
  align-items: center;
  align-self: center;
`;

export const EditProfileButtonText = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;
