import React, {useState, useCallback} from 'react';
import {
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';

import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import {RouteProp, useRoute, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import {
  uploadMultipleImages,
  deletePostImageFileIfUnused,
} from '@/lib/uploadImage';
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
import {trackEvent} from '@/lib/mixpanel';
import {POST_IMAGE_ASPECT_RATIO} from '@/constants/postImage.constant';

type RouteProps = RouteProp<
  PostsStackParamList,
  typeof POST_ROUTES.CREATE_POST_FOR_PROJECT
>;

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
// 상세화면(PostDetailScreen)과 동일한 정사각형 프레임으로 미리보기 — 실제 게시물에서 보일 모습 그대로
const PREVIEW_HEIGHT = Math.min(
  SCREEN_WIDTH / POST_IMAGE_ASPECT_RATIO,
  SCREEN_HEIGHT * 0.8,
);
// iOS 크롭 결과 리사이즈 버그 회피용 바운딩 박스 크기 (editImageUri 참고)
const EDIT_MAX_OUTPUT_SIZE = 2000;

interface ExistingImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface UnifiedImage {
  key: string;
  kind: 'existing' | 'new';
  id?: string;
  // 원래 DB에 있던 이미지였다면 그 DB row id를 계속 들고 있음 (kind가 'new'로
  // 바뀐 뒤에도 유지) — 되돌리기 시 existing 상태로 정확히 복원하기 위함
  originalId?: string;
  uri: string;
  originalUri: string;
  type?: string;
  fileName?: string;
  width?: number;
  height?: number;
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
      originalId: img.id,
      uri: img.image_url,
      originalUri: img.image_url,
    })),
  );
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]); //이미지 DB삭제
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]); //Storage 파일 정리용
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

  // 기존(existing) 이미지는 uri가 원격 https URL이라, 크롭 도구에 바로 넘기면
  // 내부적으로 저해상도로 받아와서 자르는 경우가 있어 로컬 파일로 먼저 내려받고 크롭함
  const ensureLocalUri = async (uri: string): Promise<string> => {
    if (!uri.startsWith('http')) return uri;
    const localPath = `${RNFS.CachesDirectoryPath}/edit-${Date.now()}.jpg`;
    await RNFS.downloadFile({fromUrl: uri, toFile: localPath}).promise;
    return `file://${localPath}`;
  };

  // width/height를 넘기지 않으면 크롭 도구가 1:1 기본 선택으로 열리되
  // freeStyleCropEnabled라 사용자가 자유롭게 늘려서 원본 전체를 다시 포함시킬 수 있음 (강제 크롭 아님)
  //
  // 단, iOS 네이티브 코드(imageCropViewController:didCropImage:usingCropRect:)는 width/height를
  // 안 넘기면 리사이즈 목표 크기가 (0,0)으로 계산되어 결과물이 심하게 저하되는 버그가 있음.
  // (Android는 width/height가 없으면 리사이즈 자체를 건너뛰어서 문제 없음)
  // 그래서 iOS에서만 충분히 큰 정사각 바운딩 박스를 넘겨서 이 버그를 피함 — freeStyleCropEnabled라
  // 실제 크롭 비율은 왜곡되지 않고, 그 안에 맞춰 화질 손실 없이 리사이즈만 됨.
  const editImageUri = async ( 
    uri: string,
  ): Promise<{uri: string; width: number; height: number} | null> => {
    // 안드로이드에서 크롭 화면(별도 액티비티)을 저장/취소로 닫을 때, 그 뒤로가기
    // 신호가 React Navigation에도 전달돼서 현재 화면이 통째로 pop되는(→ 홈으로
    // 이동) 문제가 있어 크롭 화면이 떠 있는 동안은 뒤로가기를 흡수해 무시함
    const backHandlerSub =
      Platform.OS === 'android'
        ? BackHandler.addEventListener('hardwareBackPress', () => true)
        : null;
    try {
      const localUri = await ensureLocalUri(uri);
      const result = await ImageCropPicker.openCropper({
        path: localUri,
        freeStyleCropEnabled: true,
        mediaType: 'photo',
        compressImageQuality: 1,
        ...(Platform.OS === 'ios'
          ? {width: EDIT_MAX_OUTPUT_SIZE, height: EDIT_MAX_OUTPUT_SIZE}
          : {}),
      });
      return {uri: result.path, width: result.width, height: result.height};
    } catch {
      return null;
    } finally {
      backHandlerSub?.remove();
    }
  };


  const handleSelectImages = async () => {
    const remaining = 10 - totalImageCount;
    if (remaining <= 0) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
      quality: 0.9,
      maxWidth: 2000,
      maxHeight: 2000,
    });
    if (result.assets && result.assets.length > 0) {
      const newImgs: UnifiedImage[] = result.assets.map((asset, i) => ({
        key: `new-${Date.now()}-${i}`,
        kind: 'new' as const,
        uri: asset.uri!,
        originalUri: asset.uri!,
        type: asset.type,
        fileName: asset.fileName,
        width: asset.width,
        height: asset.height,
      }));
      setPendingAssets(newImgs);
      setPendingActiveIndex(0);
    }
  };

  const handleTakePhoto = async () => {
    if (totalImageCount >= 10) return;

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 2000,
      maxHeight: 2000,
      saveToPhotos: true,
    });
    if (result.assets && result.assets.length > 0) {
      const newImgs: UnifiedImage[] = result.assets.map((asset, i) => ({
        key: `new-${Date.now()}-${i}`,
        kind: 'new' as const,
        uri: asset.uri!,
        originalUri: asset.uri!,
        type: asset.type,
        fileName: asset.fileName,
        width: asset.width,
        height: asset.height,
      }));
      setPendingAssets(newImgs);
      setPendingActiveIndex(0);
    }
  };

  const [imageSheetVisible, setImageSheetVisible] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<UnifiedImage[] | null>(
    null,
  );
  const [pendingActiveIndex, setPendingActiveIndex] = useState(0);

  const handleEditPendingAsset = async () => {
    if (!pendingAssets) return;
    const target = pendingAssets[pendingActiveIndex];
    const edited = await editImageUri(target.uri);
    if (!edited) return;
    setPendingAssets(prev =>
      prev
        ? prev.map((img, i) =>
            i === pendingActiveIndex
              ? {
                  ...img,
                  uri: edited.uri,
                  width: edited.width,
                  height: edited.height,
                }
              : img,
          )
        : prev,
    );
  };

  const handleRevertPendingAsset = () => {
    setPendingAssets(prev =>
      prev
        ? prev.map((img, i) =>
            i === pendingActiveIndex
              ? {
                  ...img,
                  uri: img.originalUri,
                  width: undefined,
                  height: undefined,
                }
              : img,
          )
        : prev,
    );
  };

  const handleSavePendingAssets = () => {
    if (!pendingAssets) return;
    setImages(prev => [...prev, ...pendingAssets]);
    setPendingAssets(null);
  };

  const handleDiscardPendingAssets = () => {
    setPendingAssets(null);
  };

  // 뷰어에서의 편집/되돌리기는 바로 images에 반영하지 않고 draft에서만 진행,
  // "저장"을 눌러야 커밋되고 X(닫기)는 draft를 버려서 원래 이미지 그대로 유지됨
  const [viewerDraft, setViewerDraft] = useState<UnifiedImage | null>(null);

  const handleOpenViewer = (key: string) => {
    setViewerDraft(images.find(i => i.key === key) || null);
  };

  const handleCloseViewer = () => {
    setViewerDraft(null);
  };

  const handleEditViewerImage = async () => {
    if (!viewerDraft) return;
    const edited = await editImageUri(viewerDraft.uri);
    if (!edited) return;
    setViewerDraft(prev =>
      prev
        ? {...prev, uri: edited.uri, width: edited.width, height: edited.height}
        : prev,
    );
  };

  const handleRevertViewerImage = () => {
    setViewerDraft(prev =>
      prev
        ? {...prev, uri: prev.originalUri, width: undefined, height: undefined}
        : prev,
    );
  };

  // 편집/되돌리기를 몇 번을 거쳤든, "현재 uri가 원본과 다른지"와 "원래 DB에 있던
  // 이미지였는지(originalId)"만 보고 최종 kind/id/deletedImageIds를 다시 계산함 —
  // 중간 상태(예: 편집 후 되돌리기)에 상관없이 항상 올바른 결과가 나오도록 함
  const handleSaveViewerImage = () => {
    if (!viewerDraft) return;
    const isEditedFromOriginal = viewerDraft.uri !== viewerDraft.originalUri;

    if (isEditedFromOriginal && viewerDraft.originalId) {
      setDeletedImageIds(prev =>
        prev.includes(viewerDraft.originalId!)
          ? prev
          : [...prev, viewerDraft.originalId!],
      );
      setDeletedImageUrls(prev =>
        prev.includes(viewerDraft.originalUri)
          ? prev
          : [...prev, viewerDraft.originalUri],
      );
      setImages(prev =>
        prev.map(img =>
          img.key === viewerDraft.key
            ? {...viewerDraft, kind: 'new' as const, id: undefined}
            : img,
        ),
      );
    } else if (!isEditedFromOriginal && viewerDraft.originalId) {
      setDeletedImageIds(prev =>
        prev.filter(id => id !== viewerDraft.originalId),
      );
      setDeletedImageUrls(prev =>
        prev.filter(url => url !== viewerDraft.originalUri),
      );
      setImages(prev =>
        prev.map(img =>
          img.key === viewerDraft.key
            ? {
                ...viewerDraft,
                kind: 'existing' as const,
                id: viewerDraft.originalId,
              }
            : img,
        ),
      );
    } else {
      setImages(prev =>
        prev.map(img => (img.key === viewerDraft.key ? viewerDraft : img)),
      );
    }
    setViewerDraft(null);
  };

  const handleImagePress = () => {
    if (totalImageCount >= 10) return;
    setImageSheetVisible(true);
  };

  const handleRemoveImage = (key: string) => {
    const img = images.find(i => i.key === key);
    if (img?.kind === 'existing' && img.id) {
      setDeletedImageIds(prev => [...prev, img.id!]);
      setDeletedImageUrls(prev => [...prev, img.uri]);
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
        onPress={() => handleOpenViewer(item.key)}
        onLongPress={drag}>
        <S.PreviewImage source={{uri: item.uri}} resizeMode="contain" />
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

          if (deletedImageUrls.length > 0) {
            await Promise.all(
              deletedImageUrls.map(url => deletePostImageFileIfUnused(url)),
            );
          }
        }

        // 통합 순서 기준으로 display_order 업데이트
        const existingInFinal = images.filter(img => img.kind === 'existing');
        if (existingInFinal.length > 0) {
          const updateResults = await Promise.all(
            existingInFinal.map(img =>
              supabase
                .from('post_images')
                .update({
                  display_order: images.findIndex(i => i.key === img.key),
                })
                .eq('id', img.id!)
                .select('id'),
            ),
          );
          const updateError = updateResults.find(r => r.error)?.error;
          if (updateError) throw updateError;
          // RLS 정책이 없으면 에러 없이 0행만 반영되는 경우가 있어 별도로 확인
          if (updateResults.some(r => (r.data?.length ?? 0) === 0)) {
            throw new Error(
              '이미지 순서 업데이트가 반영되지 않았습니다 (권한 정책 확인 필요)',
            );
          }
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

        trackEvent('post_created', {
          project_id: selectedProjectId,
          image_count: images.length,
        });

        // 새 게시물 작성 시 images는 전부 새로 고른 이미지여야 하지만,
        // 혹시라도 kind가 'existing'인 항목이 섞여도 원격 URL을 로컬 파일로
        // 잘못 업로드 시도하지 않도록 방어적으로 필터링
        const newImagesToUpload = images.filter(img => img.kind === 'new');
        if (newImagesToUpload.length > 0) {
          const imageUrls = await uploadMultipleImages(
            newImagesToUpload,
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
      <Modal
        visible={pendingAssets !== null}
        animationType="slide"
        onRequestClose={handleDiscardPendingAssets}>
        <S.ModalOverlay>
          <S.ModalHeader>
            <S.ModalCloseButton onPress={handleDiscardPendingAssets}>
              <Icon name="x" size={24} color="#fff" />
            </S.ModalCloseButton>
          </S.ModalHeader>
          <S.ModalMainImageWrapper>
            {pendingAssets && pendingAssets[pendingActiveIndex] && (
              <>
                <S.ModalPreviewFrame style={{height: PREVIEW_HEIGHT}}>
                  <S.ModalMainImage
                    source={{uri: pendingAssets[pendingActiveIndex].uri}}
                    resizeMode="contain"
                  />
                  {pendingAssets[pendingActiveIndex].uri !==
                    pendingAssets[pendingActiveIndex].originalUri && (
                    <S.RevertButton onPress={handleRevertPendingAsset}>
                      <Icon name="rotate-ccw" size={18} color="#fff" />
                    </S.RevertButton>
                  )}
                </S.ModalPreviewFrame>
                <S.PreviewRatioHint>
                  화면 기본 비율 1:1 · 편집에서 자유롭게 크롭 가능
                </S.PreviewRatioHint>
              </>
            )}
          </S.ModalMainImageWrapper>
          {pendingAssets && pendingAssets.length > 1 && (
            <S.FilmStripWrapper>
              <FlatList
                horizontal
                data={pendingAssets}
                keyExtractor={item => item.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                renderItem={({item, index}) => (
                  <S.FilmStripThumb
                    active={index === pendingActiveIndex}
                    onPress={() => setPendingActiveIndex(index)}>
                    <S.FilmStripImage source={{uri: item.uri}} />
                  </S.FilmStripThumb>
                )}
              />
            </S.FilmStripWrapper>
          )}
          <S.ModalActionBar>
            <S.ModalActionButton onPress={handleEditPendingAsset}>
              <S.ModalActionButtonText>편집</S.ModalActionButtonText>
            </S.ModalActionButton>
            <S.ModalActionButton primary onPress={handleSavePendingAssets}>
              <S.ModalActionButtonText primary>
                이미지 저장하기
              </S.ModalActionButtonText>
            </S.ModalActionButton>
          </S.ModalActionBar>
        </S.ModalOverlay>
      </Modal>
      <Modal
        visible={viewerDraft !== null}
        animationType="fade"
        onRequestClose={handleCloseViewer}>
        <S.ModalOverlay>
          <S.ModalHeader>
            <S.ModalCloseButton onPress={handleCloseViewer}>
              <Icon name="x" size={24} color="#fff" />
            </S.ModalCloseButton>
          </S.ModalHeader>
          <S.ModalMainImageWrapper>
            {viewerDraft && (
              <>
                <S.ModalPreviewFrame style={{height: PREVIEW_HEIGHT}}>
                  <S.ModalMainImage
                    source={{uri: viewerDraft.uri}}
                    resizeMode="contain"
                  />
                  {viewerDraft.uri !== viewerDraft.originalUri && (
                    <S.RevertButton onPress={handleRevertViewerImage}>
                      <Icon name="rotate-ccw" size={18} color="#fff" />
                    </S.RevertButton>
                  )}
                </S.ModalPreviewFrame>
                <S.PreviewRatioHint>
                  화면 기본 비율 1:1 · 편집에서 자유롭게 크롭 가능
                </S.PreviewRatioHint>
              </>
            )}
          </S.ModalMainImageWrapper>
          <S.ModalActionBar>
            <S.ModalActionButton onPress={handleEditViewerImage}>
              <S.ModalActionButtonText>편집</S.ModalActionButtonText>
            </S.ModalActionButton>
            <S.ModalActionButton primary onPress={handleSaveViewerImage}>
              <S.ModalActionButtonText primary>저장</S.ModalActionButtonText>
            </S.ModalActionButton>
          </S.ModalActionBar>
        </S.ModalOverlay>
      </Modal>
    </S.Container>
  );
}
