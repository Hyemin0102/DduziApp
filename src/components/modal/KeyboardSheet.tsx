import React, {useEffect, useState} from 'react';
import {Keyboard, Platform, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ActionSheetModal from './ActionSheetModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const KEYBOARD_GAP = 16;

// 입력칸이 있는 바텀시트 — ActionSheetModal은 키보드 처리가 없어서
// PostCommentsSheet와 같은 방식으로 키보드 높이만큼 내용 아래에 여백을 줘서 입력칸/버튼을 키보드 위로 올림
// (RN Modal 안이라 KeyboardAvoidingView / keyboard-controller 대신 키보드 이벤트로 직접 계산)
const KeyboardSheet = ({visible, onClose, children}: Props) => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  // 시트 하단 패딩(safe area)과 겹치는 만큼은 이미 비어 있으니 제외
  // 키보드가 열려 있을 땐 버튼이 키보드에 딱 붙지 않게 여백(KEYBOARD_GAP)을 더 줌
  const keyboardOverlap =
    keyboardHeight > 0
      ? Math.max(0, keyboardHeight - Math.max(insets.bottom, 16)) + KEYBOARD_GAP
      : 0;

  return (
    <ActionSheetModal visible={visible} onClose={onClose} showCancel={false}>
      <View style={{paddingHorizontal: 20, paddingTop: 4, marginBottom: keyboardOverlap}}>
        {children}
      </View>
    </ActionSheetModal>
  );
};

export default KeyboardSheet;
