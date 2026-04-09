import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

/** 전체 카드 - 세로 배치 */
export const Container = styled.View`
  padding-vertical: 8px;
`;

/** 프로필 이미지 + 이름/소개 가로 배치 */
export const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const ProfileImage = styled(FastImage)`
  width: 72px;
  height: 72px;
  border-radius: 36px;
  border-width: 1px;
  border-color: #e9e9e7;
  margin-right: 16px;
`;

export const ProfileImagePlaceholder = styled.View`
  width: 72px;
  height: 72px;
  border-radius: 36px;
  background-color: #f1f1ef;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`;

export const ProfileImagePlaceholderText = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #191919;
`;

export const InfoContainer = styled.View`
  flex: 1;
`;

export const Name = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #111;
  margin-bottom: 4px;
`;

export const Email = styled.Text`
  font-size: 13px;
  color: #999;
`;

export const ProviderBadge = styled.View`
  align-self: flex-start;
  padding-horizontal: 10px;
  padding-vertical: 4px;
  border-radius: 12px;
`;

export const ProviderText = styled.Text`
  font-size: 13px;
  color: #666;
  line-height: 18px;
`;

/** 버튼 행 - Wrapper 아래 세로로 */
export const ButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 14px;
`;

/** 외곽선 버튼 (프로필 수정) */
export const OutlineButton = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-vertical: 8px;
  border-radius: 10px;
  border-width: 1px;
  border-color: #e9e9e7;
  background-color: #fff;
`;

export const OutlineButtonText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #333;
`;

/** 채워진 버튼 (게시물 추가) */
export const FillButton = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-vertical: 8px;
  border-radius: 10px;
  background-color: #191919;
`;

export const FillButtonIcon = styled.Text`
  font-size: 15px;
  color: #fff;
  line-height: 18px;
`;

export const FillButtonText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #fff;
`;
