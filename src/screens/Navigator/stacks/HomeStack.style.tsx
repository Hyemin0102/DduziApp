import styled from '@emotion/native';

export const HeaderContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 56px;
  padding-bottom: 8px;
  padding-horizontal: 16px;
  background-color: #fff;
`;

export const Logo = styled.Image`
  width: 100%;
  height: 100%;
`;

export const LogoRow = styled.View`
  width: 97px;
  height: auto;
`;

export const SearchButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

export const SearchBubble = styled.View`
  position: relative;
  background-color: #efefef;
  border-radius: 10px;
  padding-horizontal: 14px;
  padding-vertical: 8px;
`;

export const SearchBubbleText = styled.Text`
  font-size: 13px;
  color: #666;
`;

export const SearchBubbleTail = styled.View`
  position: absolute;
  right: -5px;
  top: 50%;
  margin-top: -4px;
  width: 0;
  height: 0;
  border-top-width: 4px;
  border-bottom-width: 4px;
  border-left-width: 6px;
  border-top-color: transparent;
  border-bottom-color: transparent;
  border-left-color: #efefef;
`;
