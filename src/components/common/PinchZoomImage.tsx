import React from 'react';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  withTiming,
} from 'react-native-reanimated';
import {ZOOM_MAX_SCALE, useZoomOverlay} from './ZoomOverlay';

export default function PinchZoomImage({
  uri,
  children,
}: {
  uri: string;
  children: React.ReactNode;
}) {
  const aRef = useAnimatedRef<Animated.View>();
  const {
    rectX,
    rectY,
    rectWidth,
    rectHeight,
    focalX,
    focalY,
    overlayScale,
    setActiveUri,
  } = useZoomOverlay();

  const pinchGesture = Gesture.Pinch()
    .onStart(e => {
      const m = measure(aRef);
      if (!m) return;
      rectX.value = m.pageX;
      rectY.value = m.pageY;
      rectWidth.value = m.width;
      rectHeight.value = m.height;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
      overlayScale.value = 1;
      runOnJS(setActiveUri)(uri);
    })
    .onUpdate(e => {
      overlayScale.value = Math.max(1, Math.min(e.scale, ZOOM_MAX_SCALE));
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onEnd(() => {
      overlayScale.value = withTiming(1, {duration: 200}, finished => {
        if (finished) runOnJS(setActiveUri)(null);
      });
    });

  return (
    <GestureDetector gesture={pinchGesture}>
      <Animated.View ref={aRef} style={{flex: 1}}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
