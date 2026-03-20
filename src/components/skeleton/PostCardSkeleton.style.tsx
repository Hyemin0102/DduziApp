import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const Card = styled.View`
  padding: 20px;
  margin-bottom: 20px;
`;

export const ProfileRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const Avatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #ebebeb;
`;

export const NameLine = styled.View`
  height: 14px;
  border-radius: 6px;
  background-color: #ebebeb;
`;

export const ImageArea = styled.View`
  width: ${SCREEN_WIDTH - 40}px;
  height: 200px;
  border-radius: 8px;
  background-color: #ebebeb;
`;

export const ContentArea = styled.View`
  margin-top: 12px;
  gap: 8px;
`;

export const BadgeLine = styled.View`
  height: 20px;
  border-radius: 10px;
  background-color: #ebebeb;
`;

export const TextLine = styled.View`
  height: 14px;
  border-radius: 6px;
  background-color: #ebebeb;
`;

export const DateLine = styled.View`
  height: 12px;
  border-radius: 6px;
  background-color: #ebebeb;
`;
