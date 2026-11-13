import React from 'react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

type KeyboardAvoidProps = {
  children: React.ReactNode;
  bottomOffset?: number;
  // 'handled': 버튼 등 터치 가능한 요소를 누르면 키보드를 닫지 않고 바로 실행 (빈 영역 터치 시엔 닫힘)
  keyboardShouldPersistTaps?: 'never' | 'always' | 'handled';
};

export default function KeyboardAvoid({
  children,
  bottomOffset = 40,
  keyboardShouldPersistTaps,
}: KeyboardAvoidProps) {
  return (
    <KeyboardAwareScrollView
      style={{flex: 1}}
      contentContainerStyle={{flexGrow: 1}}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
      {children}
    </KeyboardAwareScrollView>
  );
}