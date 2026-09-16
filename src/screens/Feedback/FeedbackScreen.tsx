import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {trackEvent} from '@/lib/mixpanel';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import * as S from './FeedbackScreen.style';

const MAX_LENGTH = 1000;

export default function FeedbackScreen() {
  const {user} = useAuth();
  const {navigation} = useCommonNavigation();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const {error: insertError} = await supabase.from('feedbacks').insert({
        user_id: user.id,
        content: content.trim(),
      });
      if (insertError) throw insertError;

      trackEvent('feedback_submitted');

      const {error: fnError} = await supabase.functions.invoke(
        'send-feedback-email',
        {
          body: {
            userId: user.id,
            nickname: user.nickname ?? '알 수 없음',
            email: user.email,
            content: content.trim(),
          },
        },
      );
      if (fnError) {
        console.error('❌ 피드백 이메일 발송 실패:', fnError);
      }

      Alert.alert('전송 완료', '소중한 의견 감사합니다.', [
        {text: '확인', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('❌ 피드백 전송 실패:', error);
      Alert.alert('오류', '피드백 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <S.Container>
      <KeyboardAvoid>
        <S.Content>
          <S.Description>
            불편했던 점이나 추가되었으면 하는 기능을 자유롭게 남겨주세요.{'\n'}
            개발자가 직접 확인합니다. 👀
          </S.Description>
          <S.InputWrapper>
            <S.Input
              placeholder="의견을 입력해주세요"
              placeholderTextColor="#ccc"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={MAX_LENGTH}
            />
          </S.InputWrapper>
          <S.CharCount>
            {content.length} / {MAX_LENGTH}
          </S.CharCount>
          <S.SubmitButton
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            activeOpacity={0.8}>
            <S.SubmitButtonText>
              {isSubmitting ? '전송 중...' : '보내기'}
            </S.SubmitButtonText>
          </S.SubmitButton>
        </S.Content>
      </KeyboardAvoid>
    </S.Container>
  );
}
