import React, {createContext, useContext, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

export const ZOOM_MAX_SCALE = 4;

interface ZoomOverlayContextValue {
  rectX: SharedValue<number>;
  rectY: SharedValue<number>;
  rectWidth: SharedValue<number>;
  rectHeight: SharedValue<number>;
  focalX: SharedValue<number>;
  focalY: SharedValue<number>;
  overlayScale: SharedValue<number>;
  setActiveUri: (uri: string | null) => void;
}

const ZoomOverlayContext = createContext<ZoomOverlayContextValue | null>(null);

export function ZoomOverlayProvider({children}: {children: React.ReactNode}) {
  const rectX = useSharedValue(0);
  const rectY = useSharedValue(0);
  const rectWidth = useSharedValue(0);
  const rectHeight = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const overlayScale = useSharedValue(1);
  const [activeUri, setActiveUri] = useState<string | null>(null);

  // 핀치 시작/이동 시점의 두 손가락 중간점(focalX/Y)을 기준으로 확대 — 인스타그램처럼
  // 손가락이 가리키는 지점이 고정된 채 그 주변이 확대/이동되도록 transform-origin을 옮김
  const overlayStyle = useAnimatedStyle(() => {
    const originX = focalX.value - rectWidth.value / 2;
    const originY = focalY.value - rectHeight.value / 2;

    return {
      position: 'absolute',
      left: rectX.value,
      top: rectY.value,
      width: rectWidth.value,
      height: rectHeight.value,
      transform: [
        {translateX: originX},
        {translateY: originY},
        {scale: overlayScale.value},
        {translateX: -originX},
        {translateY: -originY},
      ],
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      Math.max(
        0,
        Math.min((overlayScale.value - 1) / (ZOOM_MAX_SCALE - 1), 1),
      ) * 0.5,
  }));

  return (
    <ZoomOverlayContext.Provider
      value={{
        rectX,
        rectY,
        rectWidth,
        rectHeight,
        focalX,
        focalY,
        overlayScale,
        setActiveUri,
      }}>
      {children}
      {activeUri && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {backgroundColor: '#000'},
              backdropStyle,
            ]}
          />
          <Animated.Image
            source={{uri: activeUri}}
            resizeMode="cover"
            style={overlayStyle}
          />
        </View>
      )}
    </ZoomOverlayContext.Provider>
  );
}

export function useZoomOverlay() {
  const ctx = useContext(ZoomOverlayContext);
  if (!ctx) {
    throw new Error('useZoomOverlay must be used within ZoomOverlayProvider');
  }
  return ctx;
}
