import React, {useState, useCallback} from 'react';
import {
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {RouteProp, useRoute, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import {uploadMultipleImages} from '@/lib/uploadImage';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {PostsStackParamList} from '@/@types/navigation';
import {ProjectItem} from '@/@types/database';

type RouteProps = RouteProp<
  PostsStackParamList,
  typeof POST_ROUTES.CREATE_POST_FOR_PROJECT
>;

// 기존 이미지 (DB에 저장된 것)
interface ExistingImage {
  id: string;
  image_url: string;
  display_order: number;
}

// 새로 추가할 이미지 (로컬 picker에서 선택한 것)
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

  // 폼 상태 – 수정 모드면 기존 데이터로 초기화
  const [content, setContent] = useState(route.params?.content || '');
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    route.params?.existingImages || [],
  );
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로젝트 선택 (홈에서 진입 시)
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

  // 기존 이미지 삭제 (DB에서 제거 예약)
  const handleRemoveExistingImage = (id: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
    setDeletedImageIds(prev => [...prev, id]);
  };

  // 새 이미지 삭제
  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      Alert.alert('알림', '프로젝트를 선택해주세요.');
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
        // ── 수정 모드

        // 1. 게시물 내용 + 프로젝트 업데이트
        const {error: updateError} = await supabase
          .from('posts')
          .update({
            project_id: selectedProjectId,
            content: content.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editPostId);
        if (updateError) throw updateError;

        // 2. 삭제된 기존 이미지 제거
        if (deletedImageIds.length > 0) {
          const {error: deleteError} = await supabase
            .from('post_images')
            .delete()
            .in('id', deletedImageIds);
          if (deleteError) throw deleteError;
        }

        // 3. 새 이미지 업로드
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
        // ── 생성 모드

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

  console.log('projects', projects);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="x" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? '게시물 수정' : '게시물 작성'}
        </Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
          <Text
            style={[styles.submitText, isSubmitting && styles.submitDisabled]}>
            {isSubmitting ? '저장 중...' : '완료'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로젝트 선택 – 홈 진입(생성) 또는 수정 모드에서 프로젝트 변경 가능 */}
        {!presetProjectId || isEditMode ? (
          <View style={styles.section}>
            <Text style={styles.label}>프로젝트 *</Text>
            <TouchableOpacity
              style={styles.projectSelector}
              onPress={() => setShowProjectPicker(!showProjectPicker)}>
              <Text
                style={[
                  styles.projectSelectorText,
                  !selectedProjectId && styles.placeholder,
                ]}>
                {selectedProjectTitle || '프로젝트를 선택해주세요'}
              </Text>
              <Icon
                name={showProjectPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#999"
              />
            </TouchableOpacity>

            {showProjectPicker && (
              <View style={styles.projectList}>
                {loadingProjects ? (
                  <ActivityIndicator size="small" color="#6b4fbb" />
                ) : (
                  <>
                    {projects.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.projectItem,
                          selectedProjectId === p.id &&
                            styles.projectItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedProjectId(p.id);
                          setSelectedProjectTitle(p.title);
                          setShowProjectPicker(false);
                        }}>
                        <Text
                          style={[
                            styles.projectItemText,
                            selectedProjectId === p.id &&
                              styles.projectItemTextSelected,
                          ]}>
                          {p.title}
                        </Text>
                        {selectedProjectId === p.id && (
                          <Icon name="check" size={16} color="#6b4fbb" />
                        )}
                      </TouchableOpacity>
                    ))}
                    {projects.length > 0 && (
                      <View style={styles.projectListDivider} />
                    )}
                    <TouchableOpacity
                      style={styles.addProjectItem}
                      onPress={handleAddProject}>
                      <Icon name="plus" size={16} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        ) : (
          // 프로젝트 상세에서 진입 시 (생성 모드) – 읽기 전용 배지
          <View style={styles.section}>
            <Text style={styles.label}>프로젝트</Text>
            <View style={styles.projectBadge}>
              <Text style={styles.projectBadgeText}>{presetProjectTitle}</Text>
            </View>
          </View>
        )}

        {/* 이미지 */}
        <View style={styles.section}>
          <Text style={styles.label}>사진</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{flexDirection: 'row', gap: 10}}>
            {/* 추가 버튼 */}
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleSelectImages}>
              <Icon name="camera" size={28} color="#999" />
              <Text style={styles.imageCount}>{totalImageCount}/10</Text>
            </TouchableOpacity>

            {/* 기존 이미지 (수정 모드) */}
            {existingImages.map(image => (
              <View key={image.id} style={styles.imagePreview}>
                <Image
                  source={{uri: image.image_url}}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={() => handleRemoveExistingImage(image.id)}>
                  <Icon name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* 새로 추가한 이미지 */}
            {newImages.map((image, index) => (
              <View key={`new-${index}`} style={styles.imagePreview}>
                <Image source={{uri: image.uri}} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={() => handleRemoveNewImage(index)}>
                  <Icon name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 내용 */}
        <View style={styles.section}>
          <Text style={styles.label}>내용 *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="오늘 뜬 내용을 자유롭게 적어주세요"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b4fbb',
  },
  submitDisabled: {
    color: '#bbb',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  projectSelectorText: {
    fontSize: 15,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  projectList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  projectItemSelected: {
    backgroundColor: '#f3f0ff',
  },
  projectItemText: {
    fontSize: 15,
    color: '#333',
  },
  projectItemTextSelected: {
    color: '#6b4fbb',
    fontWeight: '600',
  },
  projectBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  projectBadgeText: {
    fontSize: 14,
    color: '#6b4fbb',
    fontWeight: '600',
  },
  imageUploadButton: {
    width: 88,
    height: 88,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageCount: {
    fontSize: 12,
    color: '#999',
  },
  imagePreview: {
    width: 88,
    height: 88,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
  },
  projectListDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 14,
  },
  addProjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#6b4fbb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    margin: 12,
  },
});
