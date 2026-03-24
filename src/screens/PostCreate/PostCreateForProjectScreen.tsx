import React, {useState, useCallback} from 'react';
import {
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import {RouteProp, useRoute, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import {uploadMultipleImages} from '@/lib/uploadImage';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {PostsStackParamList} from '@/@types/navigation';
import {ProjectItem} from '@/@types/database';
import * as S from './PostCreateForProjectScreen.style';

type RouteProps = RouteProp<
  PostsStackParamList,
  typeof POST_ROUTES.CREATE_POST_FOR_PROJECT
>;

interface ExistingImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface NewImage {
  uri: string;
  type?: string;
  fileName?: string;
}

export default function PostCreateForProjectScreen() {
  const route = useRoute<RouteProps>();
  const {navigation} = useCommonNavigation<any>();

  const mode = route.params?.mode || 'create';
  const isEditMode = mode === 'edit';

  const presetProjectId = route.params?.projectId;
  const presetProjectTitle = route.params?.projectTitle;
  const editPostId = route.params?.postId;

  const [content, setContent] = useState(route.params?.content || '');
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    route.params?.existingImages || [],
  );
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    presetProjectId || null,
  );
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>(
    presetProjectTitle || '',
  );
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const totalImageCount = existingImages.length + newImages.length;

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return;

      const {data, error} = await supabase
        .from('projects')
        .select('id, title, created_at, updated_at, is_completed, visibility')
        .eq('user_id', user.id)
        .order('created_at', {ascending: false});

      if (error) throw error;
      setProjects((data as ProjectItem[]) || []);
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, []),
  );

  const handleAddProject = () => {
    setShowProjectPicker(false);
    navigation.navigate('ProjectDetail', {mode: 'create'});
  };

  const handleSelectImages = async () => {
    const remaining = 10 - totalImageCount;
    if (remaining <= 0) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.assets) {
      setNewImages(prev => [...prev, ...(result.assets as NewImage[])]);
    }
  };

  const handleRemoveExistingImage = (id: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
    setDeletedImageIds(prev => [...prev, id]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      Alert.alert('알림', '프로젝트를 선택해주세요.');
      return;
    }
    if (totalImageCount === 0) {
      Alert.alert('알림', '사진을 1장 이상 추가해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('알림', '로그인이 필요합니다.');
        return;
      }

      if (isEditMode && editPostId) {
        const {error: updateError} = await supabase
          .from('posts')
          .update({
            project_id: selectedProjectId,
            content: content.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editPostId);
        if (updateError) throw updateError;

        if (deletedImageIds.length > 0) {
          const {error: deleteError} = await supabase
            .from('post_images')
            .delete()
            .in('id', deletedImageIds);
          if (deleteError) throw deleteError;
        }

        if (newImages.length > 0) {
          const imageUrls = await uploadMultipleImages(
            newImages,
            'post-images',
            editPostId,
          );
          if (imageUrls.length > 0) {
            const startOrder = existingImages.length;
            const imageData = imageUrls.map((url, index) => ({
              post_id: editPostId,
              image_url: url,
              display_order: startOrder + index,
            }));
            const {error: imageError} = await supabase
              .from('post_images')
              .insert(imageData);
            if (imageError) throw imageError;
          }
        }

        Alert.alert('성공', '게시물이 수정되었습니다!', [
          {text: '확인', onPress: () => navigation.goBack()},
        ]);
      } else {
        const {data: post, error: postError} = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            project_id: selectedProjectId,
            content: content.trim(),
          })
          .select()
          .single();
        if (postError) throw postError;

        if (newImages.length > 0) {
          const imageUrls = await uploadMultipleImages(
            newImages,
            'post-images',
            post.id,
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

        Alert.alert('성공', '게시물이 작성되었습니다!', [
          {text: '확인', onPress: () => navigation.goBack()},
        ]);
      }
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
        <Icon
          name="x"
          size={24}
          color="#333"
          onPress={() => navigation.goBack()}
        />
        <S.HeaderTitle>
          {isEditMode ? '게시물 수정' : '게시물 작성'}
        </S.HeaderTitle>
        <S.SubmitButton onPress={handleSubmit} disabled={isSubmitting}>
          <S.SubmitText disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '완료'}
          </S.SubmitText>
        </S.SubmitButton>
      </S.Header>

      <KeyboardAvoid>
        {!presetProjectId || isEditMode ? (
          <S.Section>
            <S.Label>프로젝트 *</S.Label>
            <S.ProjectSelector
              onPress={() => setShowProjectPicker(!showProjectPicker)}>
              <S.ProjectSelectorText placeholder={!selectedProjectId}>
                {selectedProjectTitle || '프로젝트를 선택해주세요'}
              </S.ProjectSelectorText>
              <Icon
                name={showProjectPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#999"
              />
            </S.ProjectSelector>

            {showProjectPicker && (
              <S.ProjectList>
                {loadingProjects ? (
                  <ActivityIndicator size="small" color="#191919" />
                ) : (
                  <>
                    {projects.map(p => (
                      <S.ProjectItem
                        key={p.id}
                        selected={selectedProjectId === p.id}
                        onPress={() => {
                          setSelectedProjectId(p.id);
                          setSelectedProjectTitle(p.title);
                          setShowProjectPicker(false);
                        }}>
                        <S.ProjectItemText selected={selectedProjectId === p.id}>
                          {p.title}
                        </S.ProjectItemText>
                        {selectedProjectId === p.id && (
                          <Icon name="check" size={16} color="#191919" />
                        )}
                      </S.ProjectItem>
                    ))}
                    {projects.length > 0 && <S.ProjectListDivider />}
                    <S.AddProjectItem onPress={handleAddProject}>
                      <Icon name="plus" size={16} color="#fff" />
                    </S.AddProjectItem>
                  </>
                )}
              </S.ProjectList>
            )}
          </S.Section>
        ) : (
          <S.Section>
            <S.Label>프로젝트</S.Label>
            <S.ProjectBadge>
              <S.ProjectBadgeText>{presetProjectTitle}</S.ProjectBadgeText>
            </S.ProjectBadge>
          </S.Section>
        )}

        <S.Section>
          <S.Label>사진 *</S.Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{flexDirection: 'row', gap: 10}}>
            <S.ImageUploadButton onPress={handleSelectImages}>
              <Icon name="camera" size={28} color="#999" />
              <S.ImageCount>{totalImageCount}/10</S.ImageCount>
            </S.ImageUploadButton>

            {existingImages.map(image => (
              <S.ImagePreview key={image.id}>
                <S.PreviewImage source={{uri: image.image_url}} />
                <S.ImageRemoveButton
                  onPress={() => handleRemoveExistingImage(image.id)}>
                  <Icon name="x" size={14} color="#fff" />
                </S.ImageRemoveButton>
              </S.ImagePreview>
            ))}

            {newImages.map((image, index) => (
              <S.ImagePreview key={`new-${index}`}>
                <S.PreviewImage source={{uri: image.uri}} />
                <S.ImageRemoveButton
                  onPress={() => handleRemoveNewImage(index)}>
                  <Icon name="x" size={14} color="#fff" />
                </S.ImageRemoveButton>
              </S.ImagePreview>
            ))}
          </ScrollView>
        </S.Section>

        <S.Section>
          <S.Label>내용 *</S.Label>
          <S.TextArea
            placeholder="오늘 뜬 내용을 자유롭게 적어주세요"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </S.Section>
      </KeyboardAvoid>
    </S.Container>
  );
}
