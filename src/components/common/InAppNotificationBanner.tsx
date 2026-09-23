import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ForegroundNotification} from '@/lib/notifications';
import {navigateFromNotificationData} from '@/lib/navigationRef';

const AUTO_DISMISS_MS = 4000;
const ANIMATION_DURATION = 250;

// 앱이 포그라운드일 때 도착한 알림을 상단 배너로 보여줌 (OS가 자동으로
// 배너를 안 띄워주는 상태라 직접 구현). App.tsx에서 'inAppNotification'
// 이벤트를 emit하면 이 컴포넌트가 받아서 띄움
export default function InAppNotificationBanner() {
  const insets = useSafeAreaInsets();
  const [notification, setNotification] = useState<ForegroundNotification | null>(
    null,
  );
  const translateY = useRef(new Animated.Value(-150)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    Animated.timing(translateY, {
      toValue: -150,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => setNotification(null));
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'inAppNotification',
      (data: ForegroundNotification) => {
        setNotification(data);
        translateY.setValue(-150);
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();

        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(hide, AUTO_DISMISS_MS);
      },
    );

    return () => {
      subscription.remove();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!notification) return null;

  const handlePress = () => {
    navigateFromNotificationData(notification.data);
    hide();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {top: insets.top + 8, transform: [{translateY}]},
      ]}
      pointerEvents="box-none">
      <Pressable style={styles.card} onPress={handlePress}>
        {!!notification.title && (
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
        )}
        {!!notification.body && (
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  card: {
    backgroundColor: '#191919',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    color: '#e5e5e5',
    fontSize: 13,
    marginTop: 2,
  },
});
