// screens/Profile.tsx
import React, {useState, useEffect} from 'react';
import {View, Text, Image, TextInput, Button} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../contexts/AuthContext';
import {supabase} from '../../lib/supabase';
import {useNavigation, useRoute} from '@react-navigation/native';
import * as S from './Profile.style';

import {
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import {uploadImage} from '@/lib/uploadImage';
import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {SafeAreaView} from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const {user, updateUserProfile, setNeedsProfileSetup} = useAuth();
  const {navigation} = useCommonNavigation();
  const route = useRoute();

  const isInitialSetup = route.name === 'Profile';

  if (!user) {
    return (
      <S.Container>
        <S.Inner>
          <S.PageTitle>사용자 정보를 불러오는 중...</S.PageTitle>
        </S.Inner>
      </S.Container>
    );
  }

  const [nickname, setNickname] = useState(user.nickname || '');
  const [bio, setBio] = useState(user.bio || '');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const displayImage = imageUri || user.profile_image;

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.Container>
      <KeyboardAvoid>
        <S.Inner>
          {/* <S.PageTitle>프로필 설정</S.PageTitle> */}

          <S.ImageSection>
            {displayImage ? (
              <S.ProfileImage source={{uri: displayImage}} />
            ) : (
              <S.ProfileImagePlaceholder />
            )}
            <Button title="갤러리에서 선택" onPress={selectImage} />
            <Button title="카메라로 촬영" onPress={takePhoto} />
          </S.ImageSection>

          <S.Label>닉네임</S.Label>
          <S.Input
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChangeText={setNickname}
          />

          <S.Label>자기소개</S.Label>
          <S.TextArea
            multiline
            placeholder="자기소개를 입력하세요"
            value={bio}
            onChangeText={setBio}
          />

          <Button
            title={loading ? '저장 중...' : '완료'}
            onPress={handleSave}
            disabled={loading || !nickname.trim() || !bio.trim()}
          />
        </S.Inner>
      </KeyboardAvoid>
    </S.Container>
  );
};

export default ProfileScreen;
