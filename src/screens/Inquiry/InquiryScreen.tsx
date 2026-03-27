import React, {useState} from 'react';
import {
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';

const MAX_LENGTH = 500;

export default function InquiryScreen() {
  const {user} = useAuth();
  const {navigation} = useCommonNavigation();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const {error} = await supabase.from('inquiries').insert({
        user_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;

      Alert.alert('완료', '피드백이 전달되었습니다.\n더 나은 서비스로 보답할게요!', [
        {text: '확인', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      Alert.alert('오류', '피드백 전달에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>내용</Text>
        <TextInput
          style={styles.textArea}
          placeholder="문의 내용 / 의견을 자유롭게 작성해주세요"
          placeholderTextColor="#bbb"
          value={content}
          onChangeText={text => setContent(text.slice(0, MAX_LENGTH))}
          multiline
          textAlignVertical="top"
          editable={!submitting}
        />
        <Text style={styles.charCount}>{content.length}/{MAX_LENGTH}</Text>

        <TouchableOpacity
          style={[styles.button, (!content.trim() || submitting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!content.trim() || submitting}
          activeOpacity={0.8}>
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>피드백 보내기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    padding: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#191919',
    minHeight: 200,
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#191919',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
