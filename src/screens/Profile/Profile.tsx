// screens/Profile.tsx
import React, {useState, useEffect, useRef} from 'react';
import {Alert, ActivityIndicator} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../contexts/AuthContext';
import {supabase} from '../../lib/supabase';
import {useRoute} from '@react-navigation/native';
import * as S from './Profile.style';

import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {uploadImage} from '@/lib/uploadImage';
import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {checkNicknameDuplicate} from '@/lib/auth/userService';
import ActionSheetModal from '@/components/modal/ActionSheetModal';

const MAX_BIO_LENGTH = 150;

const ProfileScreen = () => {
  const {user, updateUserProfile, setNeedsProfileSetup} = useAuth();
  const {navigation} = useCommonNavigation();
  const route = useRoute();
  const isInitialSetup = route.name === 'Profile';
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [imageSheetVisible, setImageSheetVisible] = useState(false);
  const nicknameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!user) {
    return (
      <S.Container>
        <S.ScrollView>
          <S.FormSection>
            <S.FormRow>
              <S.Label>사용자 정보를 불러오는 중...</S.Label>
            </S.FormRow>
          </S.FormSection>
        </S.ScrollView>
      </S.Container>
    );
  }

  useEffect(() => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed === user.nickname) {
      setNicknameError(null);
      return;
    }
    if (nicknameTimer.current) clearTimeout(nicknameTimer.current);
    setNicknameChecking(true);
    nicknameTimer.current = setTimeout(async () => {
      const isDuplicate = await checkNicknameDuplicate(trimmed, user.id);
      setNicknameError(isDuplicate ? '이미 사용 중인 닉네임입니다.' : null);
      setNicknameChecking(false);
    }, 500);
    return () => {
      if (nicknameTimer.current) clearTimeout(nicknameTimer.current);
    };
  }, [nickname]);

  const displayImage = imageUri || user.profile_image;

  const handleImageEditPress = () => {
    setImageSheetVisible(true);
  };

  const selectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        selectionLimit: 1,
      });
      if (result.didCancel) return;
      if (result.errorCode) return;
      if (result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri || null);
      }
    } catch (error) {
      console.error('이미지 선택 에러:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        cameraType: 'back',
        saveToPhotos: true,
      });
      if (result.didCancel) return;
      if (result.errorCode) return;
      if (result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri || null);
      }
    } catch (error) {
      console.error('카메라 에러:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (nicknameError) {
      Alert.alert('닉네임 오류', nicknameError);
      return;
    }
    if (nicknameChecking) return;
    setLoading(true);
    try {
      let profileImageUrl = user.profile_image;

      if (imageUri) {
        const uploadedUrl = await uploadImage(imageUri, 'profile', user.id);
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        } else {
          setLoading(false);
          return;
        }
      }

      const {error} = await supabase
        .from('users')
        .update({nickname, bio, profile_image: profileImageUrl})
        .eq('id', user.id);

      if (error) throw error;

      updateUserProfile({
        nickname,
        bio,
        profile_image: profileImageUrl,
      });

      if (isInitialSetup) {
        await AsyncStorage.removeItem('needsProfileSetup');
        setNeedsProfileSetup(false);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('프로필 저장 에러:', error);
      Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isSaveDisabled =
    loading || !nickname.trim() || !!nicknameError || nicknameChecking;

  const nicknameChanged = nickname.trim() !== user.nickname;

  return (
    <S.Container>
      <KeyboardAvoid>
        {/* 프로필 이미지 */}
        <S.ImageSection>
          <S.ImageWrapper>
            {displayImage ? (
              <S.ProfileImage source={{uri: displayImage}} />
            ) : (
              <S.ProfileImagePlaceholder>
                <S.ProfileImagePlaceholderText>
                  {nickname.trim().charAt(0)?.toUpperCase() || '?'}
                </S.ProfileImagePlaceholderText>
              </S.ProfileImagePlaceholder>
            )}
            <S.ImageEditBadge onPress={handleImageEditPress}>
              <S.ImageEditBadgeText>✎</S.ImageEditBadgeText>
            </S.ImageEditBadge>
          </S.ImageWrapper>
        </S.ImageSection>

        {/* 입력 폼 */}
        <S.FormSection>
          {/* 닉네임 */}
          <S.FormRow>
            <S.Label>닉네임</S.Label>
            <S.NicknameRow>
              <S.Input
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#ccc"
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                autoCorrect={false}
              />
              <S.CharCount>{nickname.length}/20</S.CharCount>
            </S.NicknameRow>
            {nicknameChecking && (
              <S.NicknameStatus isError={false}>확인 중...</S.NicknameStatus>
            )}
            {!nicknameChecking && nicknameError && (
              <S.NicknameStatus isError={true}>
                {nicknameError}
              </S.NicknameStatus>
            )}
            {!nicknameChecking &&
              !nicknameError &&
              nicknameChanged &&
              nickname.trim() && (
                <S.NicknameStatus isError={false}>
                  사용 가능한 닉네임입니다.
                </S.NicknameStatus>
              )}
          </S.FormRow>

          {/* 자기소개 */}
          <S.FormRow>
            <S.NicknameRow>
              <S.Label>자기소개</S.Label>
              <S.CharCount>
                {bio.length}/{MAX_BIO_LENGTH}
              </S.CharCount>
            </S.NicknameRow>
            <S.TextArea
              placeholder="자신을 소개해주세요"
              placeholderTextColor="#ccc"
              value={bio}
              onChangeText={text => setBio(text.slice(0, MAX_BIO_LENGTH))}
              multiline
              scrollEnabled={false}
            />
          </S.FormRow>
        </S.FormSection>

        {/* 저장 버튼 */}
        <S.Footer>
          <S.SaveButton
            onPress={handleSave}
            disabled={isSaveDisabled}
            activeOpacity={isSaveDisabled ? 1 : 0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <S.SaveButtonText disabled={isSaveDisabled}>
                {isInitialSetup ? '프로필 설정 완료' : '저장'}
              </S.SaveButtonText>
            )}
          </S.SaveButton>
        </S.Footer>
      </KeyboardAvoid>
      <ActionSheetModal
        visible={imageSheetVisible}
        onClose={() => setImageSheetVisible(false)}
        actions={[
          {label: '라이브러리에서 선택', onPress: selectImage},
          {label: '카메라로 촬영', onPress: takePhoto},
        ]}
      />
    </S.Container>
  );
};

export default ProfileScreen;
