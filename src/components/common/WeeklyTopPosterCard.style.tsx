import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

interface RankProps {
  rank: number;
}


export const Card = styled.TouchableOpacity<RankProps>`
  width: 100px;
  padding-bottom: 20px;
  border-radius: 10px;
  align-items: center;
`;

export const AvatarBadgeWrapper = styled.View`
  position: relative;
  margin-top: 6px;
`;

export const RankBadge = styled.View<RankProps>`
  position: absolute;
  top: -6px;
  right: -8px;
  z-index: 2;
  width: 26px;
  height: 26px;
  border-radius:999px;
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
  width: 60px;
  height: 60px;
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
  background-color: #f0f0f0;
`;

export const Nickname = styled.Text`
  margin-top: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #000;
  max-width: 80px;
`;

export const CountBadge = styled.View`
  margin-top: 12px;
  flex-direction: row;
  align-items: center;
   background-color: #f7f7f7;
  border-width: 1px;
   border-color: #dbdbdb;
  border-radius: 8px;
  padding: 4px 10px 4px 6px;
`;

export const CountBadgeText = styled.Text`
  font-size: 10px;
  //font-weight: 700;
  color: #444;
`;
