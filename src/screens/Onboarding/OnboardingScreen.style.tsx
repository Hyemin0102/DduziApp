import styled from '@emotion/native';
import {Animated} from 'react-native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

export const ProgressBarSection = styled.View`
  flex-direction: row;
  padding: 16px 20px 0;
  gap: 6px;
`;

export const ProgressBarTrack = styled.View`
  flex: 1;
  height: 3px;
  background-color: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
`;

export const ProgressBarFill = styled(Animated.View)`
  height: 100%;
  background-color: #191919;
  border-radius: 2px;
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
`;

export const ReadyText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #191919;
  text-align: center;
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
