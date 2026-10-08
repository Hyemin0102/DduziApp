import React from 'react';
import {Image, ImageSourcePropType} from 'react-native';

const BADGE_IMAGES: Record<1 | 2 | 3, ImageSourcePropType> = {
  1: require('../../assets/images/badge/black_1.png'),
  2: require('../../assets/images/badge/black_2.png'),
  3: require('../../assets/images/badge/black_3.png'),
};

interface SupporterBadgeProps {
  level: 1 | 2 | 3;
  size?: number;
}

const SupporterBadge: React.FC<SupporterBadgeProps> = ({level, size = 20}) => (
  <Image
    source={BADGE_IMAGES[level]}
    style={{width: size, height: size}}
    resizeMode="contain"
  />
);

export default SupporterBadge;
