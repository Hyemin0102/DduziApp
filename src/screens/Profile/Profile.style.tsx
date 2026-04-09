import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

export const ScrollView = styled.ScrollView`
  flex: 1;
`;

// ─── 프로필 이미지 영역 ───────────────────────────────────

export const ImageSection = styled.View`
  align-items: center;
  padding: 40px 20px 28px;
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const ImageWrapper = styled.View`
  position: relative;
  margin-bottom: 20px;
`;

export const ProfileImage = styled(FastImage)`
  width: 160px;
  height: 160px;
  border-radius: 80px;
`;

export const ProfileImagePlaceholder = styled.View`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background-color: #f1f1ef;
  justify-content: center;
  align-items: center;
`;

export const ProfileImagePlaceholderText = styled.Text`
  font-size: 52px;
  font-weight: bold;
  color: #191919;
`;

export const ImageEditBadge = styled.TouchableOpacity`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #191919;
  border-width: 2.5px;
  border-color: #fff;
  justify-content: center;
  align-items: center;
`;

export const ImageEditBadgeText = styled.Text`
  font-size: 15px;
  color: #fff;
`;

export const ImageButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

export const ImageButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #e9e9e7;
  background-color: #fff;
`;

export const ImageButtonText = styled.Text`
  font-size: 13px;
  color: #333;
  font-weight: 500;
`;

// ─── 입력 폼 영역 ─────────────────────────────────────────

export const FormSection = styled.View`
  background-color: #fff;
  margin-top: 12px;
`;

export const FormRow = styled.View`
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const Label = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #999;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Input = styled.TextInput`
  font-size: 16px;
  color: #191919;
  padding: 0;
`;

export const TextArea = styled.TextInput`
  font-size: 16px;
  color: #191919;
  padding: 0;
  min-height: 80px;
  text-align-vertical: top;
`;

export const NicknameRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const NicknameStatus = styled.Text<{isError: boolean}>`
  font-size: 12px;
  color: ${({isError}) => (isError ? '#e53935' : '#4CAF50')};
  margin-top: 6px;
`;

export const CharCount = styled.Text`
  font-size: 12px;
  color: #999;
`;

// ─── 저장 버튼 ────────────────────────────────────────────

export const Footer = styled.View`
  padding: 20px 20px 8px;
`;

export const SaveButton = styled.TouchableOpacity<{disabled?: boolean}>`
  background-color: ${({disabled}) => (disabled ? '#e9e9e7' : '#191919')};
  border-radius: 12px;
  padding: 16px;
  align-items: center;
`;

export const SaveButtonText = styled.Text<{disabled?: boolean}>`
  font-size: 16px;
  font-weight: 600;
  color: ${({disabled}) => (disabled ? '#999' : '#fff')};
`;
