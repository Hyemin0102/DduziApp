import React from 'react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

type KeyboardAvoidProps = {
  children: React.ReactNode;
};

export default function KeyboardAvoid({children}: KeyboardAvoidProps) {
  return (
    <KeyboardAwareScrollView style={{flex: 1}} bottomOffset={40}>
      {children}
    </KeyboardAwareScrollView>
  );
}