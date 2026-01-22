// screens/CreatePost/CreatePost.tsx
import React, {useState} from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';

import * as S from './PostCreateScreen.styles.tsx';

type RouteParams = {
  CreatePost: {
    mode?: 'create' | 'edit';
    postData?: {
      id: string;
      title: string;
      content: string;
      yarn_info: string;
      pattern_info: string;
      pattern_url: string | null;
      needleInfo: string;
      images: Array<{id: string; image_url: string; display_order: number}>;
      knitting_logs: Array<{id: string; content: string; created_at: string}>;
    };
  };
};
import {supabase} from '@/lib/supabase.ts';
import {uploadMultipleImages} from '@/lib/uploadImage.tsx';
import KeyboardAvoid from '@/components/common/KeyboardAvoid.tsx';
import useCommonNavigation from '@/hooks/useCommonNavigation.ts';

interface KnittingLog {
  id: string;
  log_date: Date;
  content: string;
}

export default function PostCreateScreen() {
  const {navigation} = useCommonNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CreatePost'>>();

  // 수정 모드 파라미터
  const mode = route.params?.mode || 'create';
  const postData = route.params?.postData;
  const isEditMode = mode === 'edit';

  // 폼 데이터
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [yarnInfo, setYarnInfo] = useState('');
  const [needleInfo, setNeedleInfo] = useState('');
  const [patternInfo, setPatternInfo] = useState('');
  const [patternUrl, setPatternUrl] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<
    Array<{id: string; image_url: string; display_order: number}>
  >([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  // 기존 로그 (수정 모드에서 읽기 전용으로 표시)
  const [existingLogs, setExistingLogs] = useState<
    Array<{id: string; content: string; created_at: string}>
  >([]);
  // 오늘 로그가 기존에 있던 것인지 (UPDATE할지 INSERT할지 구분)
  const [todayLogId, setTodayLogId] = useState<string | null>(null);
  const [knittingLogs, setKnittingLogs] = useState<KnittingLog[]>([
    {
      id: Date.now().toString(),
      log_date: new Date(),
      content: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);


  // 수정 모드일 때 기존 데이터 로드
  React.useEffect(() => {
    if (isEditMode && postData) {
      setTitle(postData.title || '');
      setContent(postData.content || '');
      setYarnInfo(postData.yarn_info || '');
      setNeedleInfo(postData.needleInfo || '');
      setPatternInfo(postData.pattern_info || '');
      setPatternUrl(postData.pattern_url || '');
      setExistingImages(postData.images || []);

      // 오늘 날짜 확인
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const logs = postData.knitting_logs || [];

      // 오늘 날짜의 로그가 있는지 확인
      const todayLog = logs.find(log => {
        const logDate = new Date(log.created_at);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });

      if (todayLog) {
        // 오늘 로그가 있으면: 오늘 로그를 수정 가능하게, 나머지는 읽기 전용
        const otherLogs = logs.filter(log => log.id !== todayLog.id);
        setExistingLogs(otherLogs);
        setTodayLogId(todayLog.id); // 기존 로그 ID 저장 (UPDATE용)
        setKnittingLogs([
          {
            id: todayLog.id,
            log_date: new Date(todayLog.created_at),
            content: todayLog.content,
          },
        ]);
      } else {
        // 오늘 로그가 없으면: 모든 기존 로그는 읽기 전용, 새 입력창 추가
        setExistingLogs(logs);
        setTodayLogId(null); // 새 로그 (INSERT용)
        setKnittingLogs([
          {
            id: Date.now().toString(),
            log_date: new Date(),
            content: '',
          },
        ]);
      }
    }
  }, [isEditMode, postData]);

  // 이미지 선택
  const handleSelectImages = async () => {
    const totalImages = images.length + existingImages.length;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 10 - totalImages,
      quality: 0.8,
    });

    if (result.assets) {
      setImages([...images, ...result.assets]);
    }
  };

  // 새 이미지 삭제
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 기존 이미지 삭제 (수정 모드)
  const handleRemoveExistingImage = (imageId: string) => {
    setDeletedImageIds([...deletedImageIds, imageId]);
    setExistingImages(existingImages.filter(img => img.id !== imageId));
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

    setIsSubmitting(true);

    try {
      //유저 확인
      const {
        data: {user},
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('알림', '로그인이 필요합니다.');
        setIsSubmitting(false);
        return;
      }

      let currentPostId: string;

      if (isEditMode && postData) {
        // 수정 모드: UPDATE
        const {error: updateError} = await supabase
          .from('posts')
          .update({
            title: title.trim(),
            content: content.trim() || null,
            yarn_info: yarnInfo.trim() || null,
            needleInfo: needleInfo.trim() || null,
            pattern_info: patternInfo.trim() || null,
            pattern_url: patternUrl.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', postData.id);

        if (updateError) {
          console.error('게시물 수정 실패:', updateError);
          throw new Error('게시물 수정에 실패했습니다.');
        }

        currentPostId = postData.id;

        // 삭제된 이미지 처리
        if (deletedImageIds.length > 0) {
          await supabase
            .from('post_images')
            .delete()
            .in('id', deletedImageIds);
        }
      } else {
        // 생성 모드: INSERT
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

        currentPostId = post.id;
      }

      // 새 이미지 업로드
      if (images.length > 0) {
        const imageUrls = await uploadMultipleImages(
          images,
          'post-images',
          currentPostId,
        );

        if (imageUrls.length > 0) {
          const startOrder = existingImages.length;
          const imageData = imageUrls.map((url, index) => ({
            post_id: currentPostId,
            image_url: url,
            display_order: startOrder + index,
          }));

          const {error: imageError} = await supabase
            .from('post_images')
            .insert(imageData);

          if (imageError) throw imageError;
        }
      }

      // 로그 저장
      if (validLogs.length > 0) {
        for (const log of validLogs) {
          if (isEditMode && todayLogId && log.id === todayLogId) {
            // 수정 모드에서 오늘 로그가 기존에 있던 경우: UPDATE
            const {error: updateLogError} = await supabase
              .from('knitting_logs')
              .update({content: log.content.trim()})
              .eq('id', todayLogId);

            if (updateLogError) {
              console.error('로그 수정 실패:', updateLogError);
            }
          } else {
            // 새 로그: INSERT
            const {error: insertLogError} = await supabase
              .from('knitting_logs')
              .insert({
                post_id: currentPostId,
                content: log.content.trim(),
              });

            if (insertLogError) {
              console.error('로그 저장 실패:', insertLogError);
            }
          }
        }
      }

      const successMessage = isEditMode
        ? '게시물이 수정되었습니다!'
        : '게시물이 작성되었습니다!';

      Alert.alert('성공', successMessage, [
        {text: '확인', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('게시물 저장 실패:', error);
      Alert.alert('오류', '게시물 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <S.Container>
      <S.Header>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          {/* <Icon name="ArrowLeft" size={24} color="#000" /> */}
        </TouchableOpacity>
        <S.HeaderTitle>
          {isEditMode ? '프로젝트 수정' : '프로젝트 작성'}
        </S.HeaderTitle>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
          <S.SubmitText>{isSubmitting ? '저장 중...' : '완료'}</S.SubmitText>
        </TouchableOpacity>
      </S.Header>
      <KeyboardAvoid >
          
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{flexDirection: 'row', gap: 12}}>
            {/* 업로드 버튼 */}
            <S.ImageUploadButton onPress={handleSelectImages}>
              {/* <Icon name="Camera" size={32} color="#999" /> */}
              <S.ImageUploadText>
                {existingImages.length + images.length}/10
              </S.ImageUploadText>
            </S.ImageUploadButton>

            {/* 기존 이미지 (수정 모드) */}
            {existingImages.map((image, index) => (
              <S.ImagePreview key={`existing-${image.id}`}>
                <Image
                  source={{uri: image.image_url}}
                  style={{width: '100%', height: '100%', borderRadius: 8}}
                />
                <S.ImageRemoveButton
                  onPress={() => handleRemoveExistingImage(image.id)}>
                  {/* <Icon name="Close" size={16} color="#fff" /> */}
                </S.ImageRemoveButton>
                <S.ImageOrder>{index + 1}</S.ImageOrder>
              </S.ImagePreview>
            ))}

            {/* 새 이미지 미리보기 */}
            {images.map((image, index) => (
              <S.ImagePreview key={`new-${index}`}>
                <Image
                  source={{uri: image.uri}}
                  style={{width: '100%', height: '100%', borderRadius: 8}}
                />
                <S.ImageRemoveButton onPress={() => handleRemoveImage(index)}>
                  {/* <Icon name="Close" size={16} color="#fff" /> */}
                </S.ImageRemoveButton>
                <S.ImageOrder>{existingImages.length + index + 1}</S.ImageOrder>
              </S.ImagePreview>
            ))}
          </ScrollView>
          
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

          {/* 기존 로그 (수정 모드에서 읽기 전용으로 표시) */}
          {isEditMode && existingLogs.length > 0 && (
            <>
              {existingLogs.map(log => (
                <S.ExistingLogItem key={log.id}>
                  <S.ExistingLogDate>
                    {new Date(log.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </S.ExistingLogDate>
                  <S.ExistingLogContent>{log.content}</S.ExistingLogContent>
                </S.ExistingLogItem>
              ))}
            </>
          )}

          {/* 오늘 로그 라벨 */}
          {isEditMode && (
            <S.NewLogLabel>
              {todayLogId ? '오늘 로그 수정' : '+ 새 로그 추가 (선택)'}
            </S.NewLogLabel>
          )}

          {/* 새 로그 입력 */}
          {knittingLogs.map((log, index) => (
            <S.LogItem key={log.id}>
              <S.LogHeader>
                <S.LogNumber>
                  {isEditMode ? '새 로그' : index + 1}
                </S.LogNumber>

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

      </KeyboardAvoid>
    </S.Container>
  );
}
