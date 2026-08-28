import React, {useState} from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import TermsOfServiceScreen from '@/screens/TermsOfService/TermsOfServiceScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicy/PrivacyPolicyScreen';
import {useAuth} from '@/contexts/AuthContext';

export default function TermsAgreementScreen() {
  const {completeTermsAgreement, logout} = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState<'terms' | 'privacy' | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await completeTermsAgreement();
    } catch {
      Alert.alert('오류', '약관 동의 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>서비스 이용약관에{'\n'}동의해주세요</Text>
        <Text style={styles.subtitle}>
          뜨지를 계속 이용하려면 아래 약관에 동의가 필요해요.
        </Text>

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreed(prev => !prev)}
          activeOpacity={0.7}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Icon name="check" size={13} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            <Text style={styles.termsLink} onPress={() => setModalVisible('terms')}>
              서비스 이용약관
            </Text>
            {'  및  '}
            <Text style={styles.termsLink} onPress={() => setModalVisible('privacy')}>
              개인정보처리방침
            </Text>
            {'에 동의합니다 (필수)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.confirmButton, !agreed && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!agreed || isSubmitting}
          activeOpacity={0.8}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>동의하고 시작하기</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} style={styles.logoutLink}>
          <Text style={styles.logoutLinkText}>동의하지 않고 로그아웃</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalVisible === 'terms' ? '서비스 이용약관' : '개인정보처리방침'}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(null)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon name="x" size={22} color="#191919" />
            </TouchableOpacity>
          </View>
          {modalVisible === 'terms' ? <TermsOfServiceScreen /> : <PrivacyPolicyScreen />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191919',
    lineHeight: 30,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#191919',
    borderColor: '#191919',
  },
  termsText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    flexWrap: 'wrap',
  },
  termsLink: {
    color: '#191919',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  confirmButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  logoutLinkText: {
    color: '#999',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191919',
  },
});
