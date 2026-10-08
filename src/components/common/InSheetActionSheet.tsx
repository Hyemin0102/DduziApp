import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ActionSheetAction} from '@/components/modal/ActionSheetModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  actions: ActionSheetAction[];
}

const ANIMATION_DURATION = 200;
const SHEET_OFFSET = 300;

// 바텀시트 "안"에서 뜨는 보조 메뉴(댓글 ⋯ 등). RN Modal을 중첩하면 iOS에서
// 먼저 열린 Modal에 가려지거나 아예 안 뜨는 문제가 있어서, 새 Modal을 쓰지 않고
// 부모 바텀시트와 같은 View 안에 오버레이로 직접 그림(ActionSheetModal과
// 시각적으로는 동일하게 보이도록 같은 슬라이드업 연출을 재현)
export default function InSheetActionSheet({visible, onClose, actions}: Props) {
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      translateY.setValue(SHEET_OFFSET);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {toValue: 1, duration: ANIMATION_DURATION, useNativeDriver: true}),
        Animated.spring(translateY, {toValue: 0, useNativeDriver: true, bounciness: 0}),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {toValue: 0, duration: ANIMATION_DURATION, useNativeDriver: true}),
        Animated.timing(translateY, {
          toValue: SHEET_OFFSET,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [visible, translateY, opacity]);

  const handleActionPress = (action: ActionSheetAction) => {
    if (action.disabled) return;
    onClose();
    setTimeout(() => action.onPress(), ANIMATION_DURATION + 100);
  };

  if (!rendered) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, {opacity}]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
        <View style={styles.handle} />
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleActionPress(action)}
              activeOpacity={action.disabled ? 1 : 0.7}>
              <Text
                style={[
                  styles.actionText,
                  action.isDestructive && styles.destructiveText,
                  action.disabled && styles.disabledText,
                ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
        <View style={styles.cancelDivider} />
        <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  actionButton: {
    padding: 16,
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 17,
    color: '#000',
    textAlign: 'left',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  disabledText: {
    color: '#ccc',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  cancelDivider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
  },
  cancelText: {
    fontSize: 17,
    color: '#191919',
    fontWeight: '600',
  },
});
