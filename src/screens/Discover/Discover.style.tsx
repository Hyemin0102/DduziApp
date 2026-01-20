import styled from "@emotion/native";

export const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
  padding: 16px;
`;

export const SearchContainer = styled.View`
flex-direction: row;
padding: 16px;
gap: 8px;
border-bottom-width: 1px;
border-bottom-color: #eee;
`;

export const SearchInput= styled.TextInput`
flex: 1;
height: 44px;
background-color: #f5f5f5;
border-radius: 12px;
padding: 0 16px;
font-size: 16px;
`; 
export const SearchButton= styled.TouchableOpacity`
height: 44px;
padding: 0 20px;
background-color: #007AFF;
border-radius: 12px;
justify-content: center;
align-items: center;
`;

export const SearchButtonText= styled.Text`
color: #fff;
font-size: 16px;
font-weight: 600;
`

export const LoadingContainer= styled.View`
flex: 1;
justify-content: center;
align-items: center;
`;

export const EmptyContainer= styled.View`
flex: 1;
justify-content: center;
align-items: center;
padding: 40px;
`;

export const EmptyText= styled.Text`
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 8px;
`;

export const EmptySubText= styled.Text`
font-size: 14px;
color: #999;
`;

export const InitialContainer= styled.View`
flex: 1;
justify-content: center;
align-items: center;
`;

export const InitialText= styled.Text`
font-size: 16px;
color: #999;
`;
