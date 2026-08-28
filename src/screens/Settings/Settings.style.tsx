import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f5f5f5;
`;

export const ScrollView = styled.ScrollView`
  flex: 1;
`;

export const SectionLabel = styled.Text`
  font-size: 13px;
  color: #999;
  padding: 16px 16px 8px;
`;

export const MenuSection = styled.View`
  background-color: #fff;
  border-radius: 12px;
  margin: 0 16px;
`;

export const MenuItem = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const MenuText = styled.Text`
  font-size: 16px;
  color: #333;
`;

export const MenuArrow = styled.Text`
  font-size: 24px;
  color: #999;
`;

export const MenuValue = styled.Text`
  font-size: 14px;
  color: #999;
`;

export const DeleteButton = styled.TouchableOpacity`
  align-items: center;
  padding: 20px;
  margin-top: 32px;
  border-top-width: 1px;
  border-top-color: #e8e8e8;
`;

export const DeleteButtonText = styled.Text`
  color: #999;
  font-size: 14px;
  text-decoration-line: underline;
`;

export const CenterContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const VersionBadge = styled.View<{isLatest: boolean}>`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const VersionText = styled.Text`
  font-size: 14px;
  color: #999;
`;

export const LatestBadge = styled.View`
  background-color: #e8f5e9;
  border-radius: 10px;
  padding: 2px 8px;
`;

export const LatestBadgeText = styled.Text`
  font-size: 11px;
  color: #4caf50;
  font-weight: 600;
`;

export const UpdateBadge = styled.View`
  background-color: #fff3e0;
  border-radius: 10px;
  padding: 2px 8px;
`;

export const UpdateBadgeText = styled.Text`
  font-size: 11px;
  color: #ff9800;
  font-weight: 600;
`;
