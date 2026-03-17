import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
`;

export const Inner = styled.View`
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const PageTitle = styled.Text`
  font-size: 24px;
  margin-bottom: 20px;
`;

export const ImageSection = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const ProfileImage = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  margin-bottom: 20px;
`;

export const ProfileImagePlaceholder = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #ddd;
  margin-bottom: 20px;
`;

export const Label = styled.Text`
  font-size: 16px;
  margin-bottom: 10px;
  align-self: flex-start;
`;

export const Input = styled.TextInput`
  width: 100%;
  height: 50px;
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 20px;
`;

export const TextArea = styled.TextInput`
  width: 100%;
  height: 100px;
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 20px;
  text-align-vertical: top;
`;
