// components/common/Header/Header.styled.ts
import styled from '@emotion/native';

export const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  height: 56px;
  background-color: #fff;
`;

export const Left = styled.View`

`;

export const Right = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
`;

export const Title = styled.View``;

export const TitleText = styled.Text`
  font-size: 17px;
  font-weight: bold;
  color: #000000;
`;