import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

export const ScrollViewContainer = styled.ScrollView`
  flex: 1;
`;

export const InnerContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 0 24px;
`;

export const Title = styled.Text`
  font-size: 26px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 40px;
  letter-spacing: -0.5px;
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
`;

interface SocialButtonProps {
  provider: 'kakao' | 'google' | 'naver';
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
      : '#03C75A'};
  border: ${props =>
    props.provider === 'google' ? '1px solid #e0e0e0' : 'none'};
  elevation: 1;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
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
