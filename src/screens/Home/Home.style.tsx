import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f8f9fa;
  padding: 16px;
`;

export const ScrollView = styled.ScrollView`
  flex: 1;
`;

export const ContentSection = styled.View`
  backgroundcolor: #fff;
  borderradius: 12px;
  padding: 20px;
`;

export const ContentText = styled.Text`
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
`;

export const ImageCounter = styled.Text`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 16px;
  color: #ffffff;
`;
