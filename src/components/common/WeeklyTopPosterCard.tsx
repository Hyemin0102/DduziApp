import React, {useEffect, useRef} from 'react';
import {Animated, Easing} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as S from './WeeklyTopPosterCard.style';

interface WeeklyTopPosterCardProps {
  rank: number;
  nickname: string;
  profileImage: string | null;
  postCount: number;
  onPress?: () => void;
}

const RANK_ICON_NAME = 'star-shooting';

//star-shooting

// 뱃지 위에 대각선 반짝임이 좌→우로 훑고 지나가는 애니메이션 — 5개 카드가
// 전부 동시에 반짝이면 부담스러워서 순위별로 살짝 시차를 둠(rank * 220ms)
const BadgeShineEffect = ({rank}: {rank: number}) => {
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(rank * 220),
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(shineAnim, {toValue: 0, duration: 0, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rank, shineAnim]);

  const translateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });

  return (
    <Animated.View
      style={{position: 'absolute', transform: [{translateX}]}}
      pointerEvents="none">
      <S.BadgeShine />
    </Animated.View>
  );
};

const WeeklyTopPosterCard = ({
  rank,
  nickname,
  profileImage,
  postCount,
  onPress,
}: WeeklyTopPosterCardProps) => {
  return (
    <S.Card rank={rank} activeOpacity={0.85} onPress={onPress}>
      <S.RankBadge rank={rank}>
        <BadgeShineEffect rank={rank} />
        <MaterialCommunityIcon name={RANK_ICON_NAME} size={18} color="#fff" />
      </S.RankBadge>

      <S.AvatarWrapper rank={rank}>
        {profileImage ? (
          <S.Avatar source={{uri: profileImage}} />
        ) : (
          <S.AvatarPlaceholder>
            <Icon name="user" size={22} color="#ccc" />
          </S.AvatarPlaceholder>
        )}
      </S.AvatarWrapper>

      <S.Nickname numberOfLines={1}>{nickname}</S.Nickname>
      <S.CountRow>
        <S.CountText>{postCount}건</S.CountText>
        <Icon name="chevron-right" size={12} color="#999" />
      </S.CountRow>
    </S.Card>
  );
};

export default WeeklyTopPosterCard;

