// components/common/Header/AppHeader.tsx
import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Header from './Header';

interface AppHeaderProps {
  title?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
  titleDirection?: 'left' | 'center' | 'right';
  showBack?: boolean;
  onBack?: () => void;
}

const AppHeader = ({
  title,
  right,
  style,
  titleDirection,
  showBack,
  onBack,
}: AppHeaderProps) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const leftButton = showBack ? (
    <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
      <Icon name="chevron-left" size={28} color="#333" />
    </TouchableOpacity>
  ) : undefined;

  return (
    <View style={{ backgroundColor: '#fff' }}>
      <View style={{ height: insets.top }} />
      <Header
        title={title}
        left={leftButton}
        right={right}
        style={style}
        titleDirection={titleDirection}
      />
    </View>
  );
};

export default AppHeader;