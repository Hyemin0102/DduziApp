import React from 'react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

type KeyboardAvoidProps = {
  children: React.ReactNode;
  bottomOffset?: number;
};

export default function KeyboardAvoid({children, bottomOffset = 40}: KeyboardAvoidProps) {
  return (
    <KeyboardAwareScrollView style={{flex: 1}} bottomOffset={bottomOffset}>
      {children}
    </KeyboardAwareScrollView>
  );
}