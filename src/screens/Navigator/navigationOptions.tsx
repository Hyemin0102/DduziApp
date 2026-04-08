import React from 'react';
import AppHeader from '@/components/Header/AppHeader';

export const backHeaderOptions = (title: string) => ({
  headerShown: true,
  header: ({navigation}: any) => (
    <AppHeader
      title={title}
      titleDirection="left"
      showBack={navigation.canGoBack()}
    />
  ),
});
