import React, {useEffect, useRef} from 'react';
import {Animated} from 'react-native';

interface SkeletonItemProps {
  children: React.ReactNode;
  style?: object;
}

const SkeletonItem = ({children, style}: SkeletonItemProps) => {
  const animValue = useRef(new Animated.Value(0)).current;

  const interpolatedOpacity = animValue.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0.3, 0.75, 0.3],
  });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[style, {opacity: interpolatedOpacity}]}>
      {children}
    </Animated.View>
  );
};

export default SkeletonItem;
