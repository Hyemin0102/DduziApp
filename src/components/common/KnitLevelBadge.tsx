import React from 'react';
import {SvgProps} from 'react-native-svg';
import Level1 from '@/assets/images/badge/knit_level_1.svg';
import Level2 from '@/assets/images/badge/knit_level_2.svg';
import Level3 from '@/assets/images/badge/knit_level_3.svg';

const LEVEL_BADGES: Record<1 | 2 | 3, React.FC<SvgProps>> = {
  1: Level1,
  2: Level2,
  3: Level3,
};

interface KnitLevelBadgeProps {
  level: 1 | 2 | 3;
  /** 뱃지 아트를 담을 정사각 영역 지름(px). 세 SVG의 원본 비율이 제각각이라
   * react-native-svg 기본 preserveAspectRatio("xMidYMid meet")로 이 영역 안에
   * contain + 중앙 정렬됨 */
  size: number;
}

/** 아바타에 안 붙고 뱃지 아트 자체를 단독으로 보여주는 곳(가이드, 상태 화면, 프롬프트)에서 사용 */
const KnitLevelBadge: React.FC<KnitLevelBadgeProps> = ({level, size}) => {
  const Badge = LEVEL_BADGES[level];
  return <Badge width={size} height={size} />;
};

export default KnitLevelBadge;
