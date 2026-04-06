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
  padding: 60px 24px 40px;
`;

export const TopContent = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const LogoImage = styled.Image`
  width: 160px;
  height: 160px;
  resize-mode: contain;

`;

export const TextImage = styled.Image`
  width: 80px;
  height: 30px;
  resize-mode: contain;

`;

export const SubTitle = styled.Text`
  font-size: 14px;
  color: #aaaaaa;
  margin-top: 20px;
  text-align: center;
  line-height: 20px;
`;

export const SubTitleAccent = styled.Text`
  font-size: 16px;
  font-weight: 700;
  //color: #555555;
   color: #aaaaaa;
  margin-top: 6px;
  text-align: center;
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
  gap: 12px;
  margin-bottom: 20px;
`;

interface SocialButtonProps {
  provider: 'kakao' | 'google' | 'apple';
}

export const SocialButton = styled.TouchableOpacity<SocialButtonProps>`
  width: 100%;
  height: 56px;
  border-radius: 28px;
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
