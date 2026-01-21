import styled from '@emotion/native';
import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f8f9fa;
`;

export const SearchContainer = styled.View`
  flex-direction: row;
  padding: 16px;
  gap: 8px;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

export const SearchInput = styled.TextInput`
  flex: 1;
  height: 44px;
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
`;

export const SearchButton = styled.TouchableOpacity`
  height: 44px;
  padding: 0 20px;
  background-color: #007AFF;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
`;

export const SearchButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

export const ClearButton = styled.TouchableOpacity`
  height: 44px;
  padding: 0 12px;
  justify-content: center;
  align-items: center;
`;

export const ClearButtonText = styled.Text`
  color: #007AFF;
  font-size: 14px;
`;

export const ScrollView = styled.ScrollView`
  flex: 1;
  padding: 0 16px;
`;

export const ContentSection = styled.View`
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
`;

export const ContentText = styled.Text`
  font-size: 16px;
  color: #666;
  line-height: 24px;
  text-align: center;
  padding: 40px 0;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

export const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

export const EmptyText = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

export const EmptySubText = styled.Text`
  font-size: 14px;
  color: #999;
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
