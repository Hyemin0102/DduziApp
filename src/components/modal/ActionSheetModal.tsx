import React, {useRef} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

export interface ActionSheetAction {
  label: string;
  icon?: string;
  onPress: () => void;
  isDestructive?: boolean;
}

interface ActionSheetModalProps {
  visible: boolean;
  onClose: () => void;
  actions?: ActionSheetAction[];
  children?: React.ReactNode;
  showCancel?: boolean;
}

const ANIMATION_DURATION = 200;
const SHEET_OFFSET = 400;

const ActionSheetModal: React.FC<ActionSheetModalProps> = ({
  visible,
  onClose,
  actions,
  children,
  showCancel = true,
}) => {
  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleShow = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }),
    ]).start();
  };

  const animateClose = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SHEET_OFFSET,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(SHEET_OFFSET);
      opacity.setValue(0);
      callback();
    });
  };

  const handleActionPress = (action: ActionSheetAction) => {
    animateClose(() => {
      onClose();
      setTimeout(() => {
        action.onPress();
      }, 100);
    });
  };

  const handleClose = () => {
    animateClose(onClose);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      onShow={handleShow}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.root, {opacity}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
          <View style={styles.handle} />

          {children}

          {actions && actions.map((action, index) => (
            <React.Fragment key={index}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}>
                {action.icon && <Text style={styles.actionIcon}>{action.icon}</Text>}
                <Text style={[styles.actionText, action.isDestructive && styles.destructiveText]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}

          {showCancel && (
            <>
              <View style={styles.cancelDivider} />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 17,
    color: '#000',
    marginLeft: 12,
  },
  destructiveText: {
    color: '#FF3B30',
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

export default ActionSheetModal;
