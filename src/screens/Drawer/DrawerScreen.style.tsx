import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

/* ─── 상단 탭 (프로젝트 화면과 동일한 톤) ─── */

export const TabContainer = styled.View`
  flex-direction: row;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

export const Tab = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  align-items: center;
  position: relative;
`;

export const TabText = styled.Text<{active: boolean}>`
  font-size: 16px;
  font-weight: ${props => (props.active ? '700' : '400')};
  color: ${props => (props.active ? '#333' : '#999')};
`;

export const TabIndicator = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #000;
`;

/* ─── 검색창 (탐색 화면과 동일한 톤) ─── */

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
  gap: 8px;
`;

// 높이를 컨테이너와 같은 44px로 고정 — 높이 미지정이면 한글 아랫부분이 잘리고,
// height: 100%는 iOS에서 글자가 아래로 치우쳐 보임 (홈 검색창과 같은 방식)
export const SearchInput = styled.TextInput`
  flex: 1;
  height: 44px;
  font-size: 15px;
  color: #191919;
  padding-top: 0;
  padding-bottom: 0;
  text-align-vertical: center;
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

/* ─── Empty ─── */

export const Empty = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 24px;
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
  text-align: center;
`;

/* ─── 하단 추가 버튼 (프로젝트 "새 프로젝트" 버튼과 동일) ─── */

export const AddButton = styled.TouchableOpacity`
  margin: 12px 16px 16px;
  padding-vertical: 16px;
  border-radius: 14px;
  background-color: #000;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const AddButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

/* ─── 레이블리 실 검색 결과 카드 ─── */

export const YarnCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 14px 20px;
  gap: 12px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
  background-color: #fff;
`;

export const YarnThumbnail = styled(FastImage)`
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background-color: #f0f0f0;
`;

export const YarnThumbnailPlaceholder = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const YarnInfo = styled.View`
  flex: 1;
  gap: 2px;
`;

export const YarnCompany = styled.Text`
  font-size: 12px;
  color: #999;
`;

export const YarnName = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #111;
`;

export const YarnMeta = styled.Text`
  font-size: 12px;
  color: #777;
  margin-top: 2px;
`;

export const ErrorText = styled.Text`
  font-size: 13px;
  color: #ff3b30;
  padding: 16px 20px;
`;

export const FooterLoader = styled.View`
  padding: 16px 0;
`;

export const ListHeaderText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #555;
  padding: 12px 20px 4px;
`;
