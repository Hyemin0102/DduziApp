import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

export const ScrollViewContainer = styled.ScrollView`
  flex: 1;
`;

export const InnerContainer = styled.View`
  flex: 1;
  justify-content: space-between;
  align-items: center;
  padding-top: 60px;
 
`;

export const TopContent = styled.View`
  align-items: center;
  justify-content: center;
  padding-left: 24px;
  padding-right: 24px;
`;

export  const LogoText = styled.Text`
  font-family: 'Ownglyph_PDH-Rg';
  font-weight: 400;
  font-style: normal;
  font-size: 127.01px;
  line-height: 127.01px;
  letter-spacing: -2.54px;
  text-align: center;
`

export const SubTitle = styled.Text`
  font-family: Pretendard;
  font-weight: 400;
  font-style: normal;
  font-size: 18px;
  line-height: 27px;
  letter-spacing: -0.72px;
`;

export const ImageWrapper = styled.View`
  width: 100%;
  flex: 1;

`;

export const LoginImage = styled.Image`
  width: 100%;
  height: 100%;
  resize-mode: contain;
`;


export const ErrorBox = styled.View`
  width: 100%;
  background-color: #fff0f0;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #ffcccc;
`;

export const ErrorText = styled.Text`
  color: #e53935;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
`;

export const ButtonContainer = styled.View`
  width: 100%;
  gap: 10px;
  padding: 12px 20px;
`;

interface SocialButtonProps {
  provider: 'kakao' | 'google' | 'apple';
}

export const SocialButton = styled.TouchableOpacity<SocialButtonProps>`
  width: 100%;
  height: 56px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${props =>
    props.provider === 'kakao'
      ? '#FEE500'
      : props.provider === 'google'
      ? '#ffffff'
      : '#000000'};
  border: ${props =>
    props.provider === 'google' ? '1px solid #e0e0e0' : 'none'};
  elevation: 1;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
`;

export const ButtonInner = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: relative;
`;

export const ButtonIcon = styled.Image`
  width: 20px;
  height: 20px;
  resize-mode: contain;
  position: absolute;
  left: 20px;
`;

export const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.6);
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

export const ButtonText = styled.Text<{provider: string}>`
  font-size: 16px;
  font-weight: 600;
  color: ${props =>
    props.provider === 'kakao'
      ? 'rgba(0, 0, 0, 0.85)'
      : props.provider === 'google'
      ? '#1f1f1f'
      : '#ffffff'};
`;

export const DevButton = styled.TouchableOpacity`
  width: 100%;
  height: 44px;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  border: 1px dashed #ccc;
`;

export const DevButtonText = styled.Text`
  font-size: 13px;
  color: #aaa;
`;
