import styled from '@emotion/native';
import {Platform} from 'react-native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

export const SearchRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const SearchInput = styled.TextInput`
  flex: 1;
  height: 44px;
  border-radius: 10px;
  background-color: #f5f5f5;
  padding: 0 14px;
  font-size: 15px;
  color: #191919;
`;

export const SearchButton = styled.TouchableOpacity`
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  background-color: #191919;
  align-items: center;
  justify-content: center;
`;

export const SearchButtonText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
`;

export const ResultCard = styled.View`
  flex-direction: row;
  padding: 12px 16px;
  gap: 12px;
  border-bottom-width: 1px;
  border-bottom-color: #f5f5f5;
`;

export const ResultThumbnail = styled.Image`
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background-color: #eee;
`;

export const ResultInfo = styled.View`
  flex: 1;
  justify-content: center;
`;

export const ResultTitle = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #191919;
`;

export const ResultSubText = styled.Text`
  font-size: 13px;
  color: #888;
  margin-top: 4px;
`;

export const StatusText = styled.Text`
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px;
`;

export const DebugSectionLabel = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #666;
  padding: 12px 16px 4px;
`;

export const DebugBox = styled.ScrollView`
  max-height: 260px;
  background-color: #191919;
  margin: 0 16px 16px;
  border-radius: 8px;
  padding: 10px;
`;

export const DebugText = styled.Text`
  color: #9cff9c;
  font-size: 11px;
  font-family: ${Platform.OS === 'ios' ? 'Menlo' : 'monospace'};
`;
