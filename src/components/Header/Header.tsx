// components/common/Header/Header.tsx
import React from 'react';
import { ViewStyle } from 'react-native';
import * as S from './Header.style.tsx';

interface HeaderProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  title?: React.ReactNode;
  style?: ViewStyle;
  titleDirection?: 'left' | 'center' | 'right';
}

const Header = (props: React.PropsWithChildren<HeaderProps>) => {
  const { title, left, right, style, titleDirection } = props;

  return (
    <S.Wrapper style={style}>
      {!titleDirection && (
        <S.Left style={{ marginRight: title ? 0 : 'auto' }}>
          {left}
        </S.Left>
      )}

      {title && (
        <S.Title
          style={{
            flex: 1,
            marginLeft: 16,
            ...(titleDirection
              ? {
                  marginLeft: titleDirection === 'right' ? 'auto' : 16,
                  marginRight: titleDirection === 'left' ? 'auto' : 16,
                }
              : {}),
          }}>
          <S.TitleText>{title}</S.TitleText>
        </S.Title>
      )}

      {!titleDirection && (
        <S.Right>{right}</S.Right>
      )}
    </S.Wrapper>
  );
};

export default Header;