import React, {useState, useCallback} from 'react';
import {Alert, ScrollView, ActivityIndicator} from 'react-native';

import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import {RouteProp, useRoute, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import {uploadMultipleImages} from '@/lib/uploadImage';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {
  POST_ROUTES,
  PROJECTS_ROUTES,
  TAB_ROUTES,
} from '@/constants/navigation.constant';
import {PostsStackParamList} from '@/@types/navigation';
import {ProjectItem} from '@/@types/database';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import * as S from './PostCreateForProjectScreen.style';
import {View} from 'react-native';

type RouteProps = RouteProp<
  PostsStackParamList,
  typeof POST_ROUTES.CREATE_POST_FOR_PROJECT
>;

interface ExistingImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface UnifiedImage {
  key: string;
  kind: 'existing' | 'new';
  id?: string;
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
  const [images, setImages] = useState<UnifiedImage[]>(
    (route.params?.existingImages || []).map((img: ExistingImage) => ({
      key: img.id,
      kind: 'existing' as const,
      id: img.id,
      uri: img.image_url,
    })),
  );
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]); //이미지 DB삭제
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

  const totalImageCount = images.length;

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
    navigation.navigate(TAB_ROUTES.PROJECTS_TAB, {
      screen: PROJECTS_ROUTES.PROJECT_DETAIL,
      params: {mode: 'create'},
    });
  };

  const handleSelectImages = async () => {
    const remaining = 10 - totalImageCount;
    if (remaining <= 0) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
      quality: 0.8,
      maxWidth: 1280,
      maxHeight: 1280,
    });
    if (result.assets) {
      const newImgs: UnifiedImage[] = result.assets.map((asset, i) => ({
        key: `new-${Date.now()}-${i}`,
        kind: 'new' as const,
        uri: asset.uri!,
        type: asset.type,
        fileName: asset.fileName,
      }));
      setImages(prev => [...prev, ...newImgs]);
    }
  };

  const handleTakePhoto = async () => {
    if (totalImageCount >= 10) return;

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1280,
      maxHeight: 1280,
      saveToPhotos: true,
    });
    if (result.assets) {
      const newImgs: UnifiedImage[] = result.assets.map((asset, i) => ({
        key: `new-${Date.now()}-${i}`,
        kind: 'new' as const,
        uri: asset.uri!,
        type: asset.type,
        fileName: asset.fileName,
      }));
      setImages(prev => [...prev, ...newImgs]);
    }
  };

  const [imageSheetVisible, setImageSheetVisible] = useState(false);

  const handleImagePress = () => {
    if (totalImageCount >= 10) return;
    setImageSheetVisible(true);
  };

  const handleRemoveImage = (key: string) => {
    const img = images.find(i => i.key === key);
    if (img?.kind === 'existing' && img.id) {
      setDeletedImageIds(prev => [...prev, img.id!]);
    }
    setImages(prev => prev.filter(i => i.key !== key));
  };

  const renderImageItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<UnifiedImage>) => (
    <ScaleDecorator>
      <S.ImagePreview
        style={{marginRight: 10, opacity: isActive ? 0.8 : 1}}
        onLongPress={drag}>
        <S.PreviewImage source={{uri: item.uri}} />
        <S.ImageRemoveButton onPress={() => handleRemoveImage(item.key)}>
          <Icon name="x" size={14} color="#fff" />
        </S.ImageRemoveButton>
      </S.ImagePreview>
    </ScaleDecorator>
  );

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

        // 통합 순서 기준으로 display_order 업데이트
        const existingInFinal = images.filter(img => img.kind === 'existing');
        if (existingInFinal.length > 0) {
          await Promise.all(
            existingInFinal.map(img =>
              supabase
                .from('post_images')
                .update({
                  display_order: images.findIndex(i => i.key === img.key),
                })
                .eq('id', img.id!),
            ),
          );
        }

        const newInFinal = images.filter(img => img.kind === 'new');
        if (newInFinal.length > 0) {
          const imageUrls = await uploadMultipleImages(
            newInFinal,
            'post-images',
            editPostId,
          );
          if (imageUrls.length > 0) {
            const imageData = imageUrls.map((url, i) => ({
              post_id: editPostId,
              image_url: url,
              display_order: images.findIndex(img => img === newInFinal[i]),
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

        if (images.length > 0) {
          const imageUrls = await uploadMultipleImages(
            images,
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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}>
          <Icon
            name="chevron-left"
            size={24}
            color="#333"
            onPress={() => navigation.goBack()}
          />
          <S.HeaderTitle>
            {isEditMode ? '게시물 수정' : '게시물 작성'}
          </S.HeaderTitle>
        </View>

        <Icon
          name="x"
          size={24}
          color="#333"
          onPress={() => navigation.goBack()}
        />
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
                        <S.ProjectItemText
                          selected={selectedProjectId === p.id}>
                          {p.title}
                        </S.ProjectItemText>
                        {selectedProjectId === p.id && (
                          <Icon name="check" size={16} color="#191919" />
                        )}
                      </S.ProjectItem>
                    ))}
                    {projects.length > 0 && <S.ProjectListDivider />}
                    <S.AddProjectItem onPress={handleAddProject}>
                      <S.PlusText>새 프로젝트</S.PlusText>
                      <Icon name="plus" size={16} color="#999" />
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
          <DraggableFlatList
            horizontal
            data={images}
            keyExtractor={item => item.key}
            renderItem={renderImageItem}
            onDragEnd={({data}) => setImages(data)}
            showsHorizontalScrollIndicator={false}
            ListHeaderComponent={
              <S.ImageUploadButton
                onPress={handleImagePress}
                style={{marginRight: 10}}>
                <Icon name="camera" size={28} color="#999" />
                <S.ImageCount>{totalImageCount}/10</S.ImageCount>
              </S.ImageUploadButton>
            }
          />
        </S.Section>

        <S.Section>
          <S.Label>내용 *</S.Label>
          <S.TextArea
            placeholder="게시물의 내용을 작성해주세요"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            placeholderTextColor="#999"
            maxLength={2000}
          />
        </S.Section>
      </KeyboardAvoid>
      <S.PostButton onPress={handleSubmit} disabled={isSubmitting}>
        <S.PostButtonText>게시하기</S.PostButtonText>
      </S.PostButton>
      <ActionSheetModal
        visible={imageSheetVisible}
        onClose={() => setImageSheetVisible(false)}
        actions={[
          {label: '라이브러리에서 선택', onPress: handleSelectImages},
          {label: '카메라로 촬영', onPress: handleTakePhoto},
        ]}
      />
      {isSubmitting && (
        <S.LoadingOverlay>
          <ActivityIndicator size="large" color="#fff" />
          <S.LoadingText>저장 중...</S.LoadingText>
        </S.LoadingOverlay>
      )}
    </S.Container>
  );
}
