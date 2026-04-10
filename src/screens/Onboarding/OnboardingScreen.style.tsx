import styled from '@emotion/native';
import {Animated} from 'react-native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

export const GestureView = styled.View`
  flex: 1;
`;

export const TapZoneLeft = styled.Pressable`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 40%;
  z-index: 1;
`;

export const TapZoneRight = styled.Pressable`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40%;
  z-index: 1;
`;

export const BottomAreaWrapper = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
`;


export const ContentArea = styled(Animated.View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 0 32px;
`;

export const Headline = styled.Text`
  font-size: 30px;
  font-weight: 800;
  color: #191919;
  text-align: center;
  margin-bottom: 20px;
  line-height: 42px;
  letter-spacing: -0.5px;
`;

export const Description = styled.Text`
  font-size: 16px;
  color: #888888;
  text-align: center;
  line-height: 26px;
`;

export const BottomArea = styled.View`
  min-height: 130px;
  padding: 0 24px 44px;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  z-index: 2;
`;

export const Pagination = styled.View`
  flex-direction: row;
  gap: 6px;
  align-items: center;
`;

export const Dot = styled.View<{active: boolean}>`
  width: ${({active}) => (active ? '20px' : '8px')};
  height: 8px;
  border-radius: 4px;
  background-color: ${({active}) => (active ? '#191919' : '#d0d0d0')};
`;

export const ReadyText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #191919;
  text-align: center;
  margin-top: 32px;
`;

export const ActionButton = styled.TouchableOpacity`
  width: 100%;
  height: 56px;
  background-color: #191919;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
`;

export const ActionButtonText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2px;
`;
