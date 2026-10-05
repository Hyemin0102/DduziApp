import styled from '@emotion/native';

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

export const SearchInputContainer = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  height: 44px;
  border-radius: 10px;
  background-color: #f5f5f5;
  padding: 0 14px;
`;

export const SearchInput = styled.TextInput`
  flex: 1;
  font-size: 15px;
  color: #191919;
  padding: 0;
`;

export const ClearButton = styled.TouchableOpacity`
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: #ccc;
  justify-content: center;
  align-items: center;
  margin-left: 4px;
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

export const FilterRow = styled.View`
  padding: 10px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const FilterButton = styled.TouchableOpacity<{active?: boolean}>`
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 16px;
  background-color: ${({active}) => (active ? '#191919' : '#f5f5f5')};
`;

export const Chip = styled.TouchableOpacity<{active?: boolean}>`
  padding: 7px 14px;
  border-radius: 16px;
  background-color: ${({active}) => (active ? '#191919' : '#f5f5f5')};
`;

export const ChipText = styled.Text<{active?: boolean}>`
  font-size: 13px;
  font-weight: ${({active}) => (active ? '600' : '400')};
  color: ${({active}) => (active ? '#fff' : '#333')};
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
