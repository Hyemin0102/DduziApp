// screens/CreatePost/CreatePost.tsx
import React, {useState} from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Button,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';

import * as S from './PostCreateScreen.styles.tsx';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {supabase} from '@/lib/supabase.ts';
import {uploadMultipleImages} from '@/lib/uploadImage.tsx';

interface KnittingLog {
  id: string;
  log_date: Date;
  content: string;
}

export default function PostCreateScreen() {
  const navigation = useNavigation();

  // 폼 데이터
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [yarnInfo, setYarnInfo] = useState('');
  const [needleInfo, setNeedleInfo] = useState('');
  const [patternInfo, setPatternInfo] = useState('');
  const [patternUrl, setPatternUrl] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [knittingLogs, setKnittingLogs] = useState<KnittingLog[]>([
    {
      id: Date.now().toString(),
      log_date: new Date(),
      content: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // 이미지 선택
  const handleSelectImages = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 10 - images.length,
      quality: 0.8,
    });

    if (result.assets) {
      setImages([...images, ...result.assets]);
    }
  };

  // 이미지 삭제
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 로그 내용 변경
  const handleLogContentChange = (id: string, text: string) => {
    setKnittingLogs(
      knittingLogs.map(log => (log.id === id ? {...log, content: text} : log)),
    );
  };

  // 제출
  const handleSubmit = async () => {
    // 유효성 검사
    if (!title.trim()) {
      Alert.alert('알림', '프로젝트 제목을 입력해주세요.');
      return;
    }

    const validLogs = knittingLogs.filter(log => log.content.trim() !== '');

    if (validLogs.length === 0) {
      Alert.alert('알림', '최소 1개의 로그 내용을 작성해주세요.');
      return;
    }

    setIsSubmitting(true);

    //유저 확인
    const {
      data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('알림', '로그인이 필요합니다.');
      setIsSubmitting(false);
      return;
    }

    const {data: post, error: postError} = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim() || null,
        yarn_info: yarnInfo.trim() || null,
        needleInfo: needleInfo.trim() || null,
        pattern_info: patternInfo.trim() || null,
        pattern_url: patternUrl.trim() || null,
      })
      .select()
      .single();

    if (postError) {
      console.error('게시물 생성 실패:', postError);
      throw new Error('게시물 생성에 실패했습니다.');
    }

    //이미지 업로드
    if (images.length > 0) {
      // 여러 이미지 업로드
      const imageUrls = await uploadMultipleImages(
        images,
        'post-images', // 버킷 이름
        post.id, // 폴더 경로 (postId)
      );

      if (imageUrls.length > 0) {
        const imageData = imageUrls.map((url, index) => ({
          post_id: post.id,
          image_url: url,
          display_order: index,
        }));

        const {error: imageError} = await supabase
          .from('post_images')
          .insert(imageData);

        if (imageError) throw imageError;
      }
    }

    //로그 저장
    if (validLogs.length > 0) {
      const logsData = validLogs.map(log => ({
        post_id: post.id,
        content: log.content.trim(),
      }));

      const {error: logError} = await supabase
        .from('knitting_logs')
        .insert(logsData);

      if (logError) {
        console.error('로그 저장 실패:', logError);
      }
    }

    console.log({
      title,
      content,
      yarnInfo,
      patternInfo,
      patternUrl,
      images,
      knittingLogs,
    });

    Alert.alert('성공', '게시물이 작성되었습니다!', [
      {text: '확인', onPress: () => navigation.goBack()},
    ]);
  };

  return (
    <S.Container>
      <S.Header>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          {/* <Icon name="ArrowLeft" size={24} color="#000" /> */}
        </TouchableOpacity>
        <S.HeaderTitle>프로젝트 작성</S.HeaderTitle>
        <TouchableOpacity onPress={handleSubmit}>
          <S.SubmitText>완료</S.SubmitText>
        </TouchableOpacity>
      </S.Header>
      <KeyboardAwareScrollView>
        {/* 제목 */}
        <S.Section>
          <S.Label>프로젝트 제목 *</S.Label>
          <S.Input
            placeholder="예: 아기 담요 만들기"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
        </S.Section>

        {/* 이미지 업로드 */}
        <S.Section>
          <S.Label>프로젝트 사진</S.Label>
          <S.ImageSection>
            {/* 업로드 버튼 */}
            <S.ImageUploadButton onPress={handleSelectImages}>
              {/* <Icon name="Camera" size={32} color="#999" /> */}
              <S.ImageUploadText>{images.length}/10</S.ImageUploadText>
            </S.ImageUploadButton>

            {/* 이미지 미리보기 */}
            {images.map((image, index) => (
              <S.ImagePreview key={index}>
                <Image
                  source={{uri: image.uri}}
                  style={{width: '100%', height: '100%', borderRadius: 8}}
                />
                <S.ImageRemoveButton onPress={() => handleRemoveImage(index)}>
                  {/* <Icon name="Close" size={16} color="#fff" /> */}
                </S.ImageRemoveButton>
                <S.ImageOrder>{index + 1}</S.ImageOrder>
              </S.ImagePreview>
            ))}
          </S.ImageSection>
        </S.Section>

        {/* 프로젝트 설명 */}
        <S.Section>
          <S.Label>프로젝트 설명</S.Label>
          <S.TextArea
            placeholder="프로젝트에 대해 자유롭게 설명해주세요"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </S.Section>

        {/* 실 정보 */}
        <S.Section>
          <S.Label>실 정보</S.Label>
          <S.TextArea
            placeholder="사용한 실의 브랜드, 색상, 두께 등"
            value={yarnInfo}
            onChangeText={setYarnInfo}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </S.Section>

        {/* 바늘 정보 */}
        <S.Section>
          <S.Label>바늘 정보</S.Label>
          <S.TextArea
            placeholder="사용한 바늘의 브랜드, 두께 등"
            value={needleInfo}
            onChangeText={setNeedleInfo}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </S.Section>

        {/* 도안 정보 */}
        <S.Section>
          <S.Label>도안 정보</S.Label>
          <S.TextArea
            placeholder="사용한 도안에 대한 설명"
            value={patternInfo}
            onChangeText={setPatternInfo}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </S.Section>

        {/* 도안 URL */}
        <S.Section>
          <S.Label>도안 링크 또는 이미지 주소</S.Label>
          <S.Input
            placeholder="https://..."
            value={patternUrl}
            onChangeText={setPatternUrl}
            keyboardType="url"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </S.Section>

        {/* 뜨개 로그 */}
        <S.Section>
          <S.LabelRow>
            <S.Label>뜨개 로그</S.Label>
          </S.LabelRow>

          {knittingLogs.map((log, index) => (
            <S.LogItem key={log.id}>
              <S.LogHeader>
                <S.LogNumber>{index + 1}</S.LogNumber>

                <S.DateButton>
                  {/* <Icon name="Calendar" size={16} color="#666" /> */}
                  <S.DateText>
                    {log.log_date.toLocaleDateString('ko-KR')}
                  </S.DateText>
                </S.DateButton>
              </S.LogHeader>
              <S.LogInput
                placeholder="오늘 뜬 내용을 적어주세요"
                value={log.content}
                onChangeText={text => handleLogContentChange(log.id, text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </S.LogItem>
          ))}
        </S.Section>

        <S.BottomSpace />
      </KeyboardAwareScrollView>
    </S.Container>
  );
}
