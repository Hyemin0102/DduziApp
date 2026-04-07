import styled from '@emotion/native';

export const HeaderContainer = styled.View<{paddingTop?: number}>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: ${({paddingTop}) => 56 + (paddingTop ?? 0)}px;
  padding-top: ${({paddingTop}) => paddingTop ?? 0}px;
  padding-bottom: 8px;
  padding-horizontal: 16px;
  background-color: #fff;
  
`;

export const Logo = styled.Image`
  width: 30px;
  height: 30px;
`;

export const LogoText = styled.Image`
  width: 50px;
  height: 24px;
  margin-left: 6px;
`;

export const LogoRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const SearchButton = styled.TouchableOpacity``;
