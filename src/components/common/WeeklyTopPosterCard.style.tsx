import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

interface RankProps {
  rank: number;
}

export const Card = styled.TouchableOpacity<RankProps>`
  width: 100px;
  padding: 16px 10px 14px 10px;
  border-radius: 14px;
  align-items: center;
  background-color: #fff;
  border-width: 1px;
  border-color: #eeeeee;
  position: relative;
  margin-right: 10px;
`;

export const RankBadge = styled.View<RankProps>`
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: #191919;
  border-width: 2px;
  border-color: #fff;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3px;
  elevation: 5;
  overflow: hidden;
`;

export const BadgeShine = styled.View`
  position: absolute;
  width: 10px;
  height: 36px;
  background-color: rgba(255, 255, 255, 0.55);
  transform: rotate(20deg);
`;

export const AvatarWrapper = styled.View<RankProps>`
  width: 56px;
  height: 56px;
  border-radius: 1000px;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-width: 2px;
  border-color: #000;
  overflow: hidden;
`;

export const Avatar = styled(FastImage)`
  width: 100%;
  height: 100%;
`;

export const AvatarPlaceholder = styled.View`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
`;

export const Nickname = styled.Text`
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #191919;
  max-width: 84px;
`;

export const CountRow = styled.View`
  margin-top: 4px;
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

export const CountText = styled.Text`
  font-size: 12px;
  color: #999;
  font-weight: 600;
`;
