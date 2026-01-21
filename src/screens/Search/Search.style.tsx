import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

export const SearchHeader = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px 8px 12px 4px;
  gap: 8px;
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

export const BackButton = styled.TouchableOpacity`
  padding: 4px;
  justify-content: center;
  align-items: center;
`;

export const SearchInputContainer = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 0 12px;
`;

export const SearchInput = styled.TextInput`
  flex: 1;
  height: 44px;
  font-size: 16px;
  color: #333;
`;

export const ClearButton = styled.TouchableOpacity`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: #ccc;
  justify-content: center;
  align-items: center;
`;

export const ClearButtonText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: bold;
`;

export const SearchButton = styled.TouchableOpacity`
  height: 44px;
  padding: 0 16px;
  background-color: #007aff;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
`;

export const SearchButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

export const CenterContainer = styled.View`
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
  text-align: center;
`;
