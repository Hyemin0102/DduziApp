import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';

const OnboardingScreen = () => {
  const {completeOnboarding} = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>뜨지에 오신 것을 환영해요!</Text>
      <Text style={styles.subtitle}>온보딩 화면 (임시)</Text>
      <TouchableOpacity style={styles.button} onPress={completeOnboarding}>
        <Text style={styles.buttonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#191919',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#191919',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
