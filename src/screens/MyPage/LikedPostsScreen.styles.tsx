import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
export const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

export const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const Empty = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 40px;
`;

export const EmptyIcon = styled.Image`
  width: 160px;
  height: 160px;
  margin-bottom: 8px;
`;

export const EmptyText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

export const EmptySubText = styled.Text`
  font-size: 14px;
  color: #999;
`;

export const GridItem = styled.TouchableOpacity`
  position: relative;
  overflow: hidden;
`;

export const GridImage = styled(FastImage)`
  width: 100%;
  height: 100%;
`;

export const GridNoImage = styled.View`
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  justify-content: center;
  align-items: center;
`;

export const GridNoImageText = styled.Text`
  font-size: 32px;
`;

export const MultipleImageIcon = styled.View`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 4px;
  border-radius: 4px;
`;
