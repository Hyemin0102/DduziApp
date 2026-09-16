import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

export const Content = styled.View`
  flex: 1;
  padding: 20px 16px;
`;

export const Description = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 20px;
  margin-bottom: 16px;
`;

export const InputWrapper = styled.View`
  flex: 1;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 14px;
`;

export const Input = styled.TextInput`
  flex: 1;
  font-size: 15px;
  color: #191919;
  text-align-vertical: top;
`;

export const CharCount = styled.Text`
  align-self: flex-end;
  font-size: 12px;
  color: #bbb;
  margin-top: 8px;
`;

export const SubmitButton = styled.TouchableOpacity<{disabled?: boolean}>`
  background-color: ${({disabled}) => (disabled ? '#ccc' : '#191919')};
  border-radius: 10px;
  height: 50px;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
`;

export const SubmitButtonText = styled.Text`
  color: #fff;
  font-size: 15px;
  font-weight: 600;
`;
