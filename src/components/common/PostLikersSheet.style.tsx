import styled from '@emotion/native';

export const Container = styled.View`
  padding-top: 8px;
  padding-bottom: 24px;
`;

export const Title = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #000;
  padding: 12px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #eeeeee;
`;

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
`;

export const Avatar = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f1ef;
`;

export const AvatarPlaceholder = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f1ef;
  align-items: center;
  justify-content: center;
`;

export const AvatarPlaceholderText = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #191919;
`;

export const TextColumn = styled.View`
  flex: 1;
  gap: 2px;
`;

export const Nickname = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: #191919;
`;

export const Bio = styled.Text`
  font-size: 13px;
  color: #666;
`;

export const Empty = styled.Text`
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 40px 20px;
`;
