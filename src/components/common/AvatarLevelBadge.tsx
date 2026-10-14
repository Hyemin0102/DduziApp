import React from 'react';
import {View} from 'react-native';
import {SvgProps} from 'react-native-svg';
import Level1 from '@/assets/images/badge/knit_level_1.svg';
import Level2 from '@/assets/images/badge/knit_level_2.svg';
import Level3 from '@/assets/images/badge/knit_level_3.svg';

// TODO: 성능 때문에 PNG로 교체 예정 (지금은 비율 확인용 임시 SVG).
// PNG로 바꿀 때는 아래 각 레벨 분기에서 <Badge .../> 자리만
// <Image source={...} resizeMode="contain" /> 로 바꾸면 되고,
// 사이징/포지셔닝 로직은 그대로 재사용 가능.
const LEVEL_BADGES: Record<1 | 2 | 3, React.FC<SvgProps>> = {
  1: Level1,
  2: Level2,
  3: Level3,
};

interface AvatarLevelBadgeProps {
  /** 감싸는 아바타(children)의 지름(px). 기존 ProfileImage 등에 쓰던 값 그대로 */
  size: number;
  /** null/undefined면 뱃지를 아예 안 그림(응원 등급 없음 또는 비공개 처리는 호출부에서 결정) */
  level?: 1 | 2 | 3 | null;
  children: React.ReactNode;
}

const AvatarLevelBadge: React.FC<AvatarLevelBadgeProps> = ({
  size,
  level,
  children,
}) => {
  if (!level) return <>{children}</>;

  const Badge = LEVEL_BADGES[level];

  // 레벨마다 실제 아트(실뭉치/뜨개 패치/목도리)의 모양과 붙는 위치가 달라서
  // 레벨별로 별도 사이징·포지셔닝을 둠 (기존처럼 비율 하나로 공유 불가)
  if (level === 1) {
    // 1단계: 실뭉치, 아바타 오른쪽 하단에 작게 걸침
    const badgeSize = Math.round(size * 0.38);
    const offset = Math.round(badgeSize * 0.12);
    return (
      <View style={{width: size, height: size}}>
        {children}
        <View
          style={{position: 'absolute', right: -offset, bottom: -offset}}
          pointerEvents="none">
          <Badge width={badgeSize} height={badgeSize} />
        </View>
      </View>
    );
  }

  if (level === 2) {
    // 2단계: 뜨개 패치, 아바타 하단 중앙에 걸쳐서 붙음
    const badgeWidth = Math.round(size * 1.2);
    const badgeHeight = Math.round((badgeWidth * 64) / 91);
    return (
      <View style={{width: size, height: size}}>
        {children}
        <View
          style={{
            position: 'absolute',
            left: Math.round((size - badgeWidth) / 8),
            bottom: -Math.round(badgeHeight * 0.2),
          }}
          pointerEvents="none">
          <Badge width={badgeWidth} height={badgeHeight} />
        </View>
      </View>
    );
  }

  // 3단계: 목도리, 아바타 전체를 두르도록 원보다 크게 중앙 정렬
  const wrapSize = Math.round(size * 1.3);
  const wrapOffset = Math.round((wrapSize - size) / 2);
  return (
    <View style={{width: size, height: size}}>
      {children}
      <View
        style={{
          position: 'absolute',
          left: -wrapOffset,
          top: -wrapOffset + 4,
          width: wrapSize,
          height: wrapSize,
        }}
        pointerEvents="none">
        <Badge width={wrapSize} height={wrapSize} />
      </View>
    </View>
  );
};

export default AvatarLevelBadge;
