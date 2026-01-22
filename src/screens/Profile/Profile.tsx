// screens/Profile.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Button,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../contexts/AuthContext';
import {supabase} from '../../lib/supabase';
import {ScrollView} from 'react-native-gesture-handler';
import {useNavigation, useRoute} from '@react-navigation/native';

import {
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import {uploadImage} from '@/lib/uploadImage';
import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import useCommonNavigation from '@/hooks/useCommonNavigation';

const ProfileScreen = () => {
  const {user, updateUserProfile, setNeedsProfileSetup} = useAuth();
  const {navigation} = useCommonNavigation();
  const route = useRoute();

  // 최초 프로필 설정 모드인지 확인 (RootStack에서 온 경우), 프로필 편집은 ProfileEdit
  const isInitialSetup = route.name === 'Profile';

  if (!user) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text>사용자 정보를 불러오는 중...</Text>
      </View>
    );
  }

  //프로필 수정
  const [nickname, setNickname] = useState(user.nickname || '');
  const [bio, setBio] = useState(user.bio || '');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  console.log('이미지', imageUri);

  const displayImage = imageUri || user.profileImage;

  const selectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        console.log('사용자가 취소했습니다.');
        return;
      }

      if (result.errorCode) {
        console.log('에러:', result.errorMessage);
        return;
      }

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

      if (result.didCancel) {
        console.log('사용자가 취소했습니다.');
        return;
      }

      if (result.errorCode) {
        console.log('에러:', result.errorMessage);
        return;
      }

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
      let profileImageUrl = user.profileImage;

      // 🔥 새 이미지를 선택했으면 업로드
      if (imageUri) {
        console.log('📤 이미지 업로드 중...');
        const uploadedUrl = await uploadImage(imageUri, 'profile', user.id);

        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
          console.log('✅ 이미지 업로드 완료:', uploadedUrl);
        } else {
          console.log('✅ 이미지 업로드 실패');
          setLoading(false);
          return;
        }
      }

      console.log('profileImageUrl???',profileImageUrl);
      

      // DB 업데이트
      const {error} = await supabase
        .from('users')
        .update({
          username: nickname,
          bio: bio,
          profile_image: profileImageUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      // AuthContext의 user 상태 업데이트
      updateUserProfile({
        nickname: nickname,
        bio: bio,
        profileImage: profileImageUrl,
      });

      console.log('⭐️ Context 업데이트 완료, 현재 user:', user);

      if (isInitialSetup) {
        // 최초 프로필 설정 완료
        await AsyncStorage.removeItem('needsProfileSetup');
        setNeedsProfileSetup(false); // Context 상태 업데이트
        console.log('✅ 최초 프로필 설정 완료 - Home으로 자동 이동');
        // needsProfileSetup false로 Navigator가 자동으로 TabNavigator로 전환
      } else {
        // 프로필 편집 완료 - 이전 화면으로 돌아가기
        console.log('✅ 프로필 업데이트 완료 - 이전 화면으로 이동');
        navigation.goBack();
      }
    } catch (error) {
      console.error('프로필 저장 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
<KeyboardAvoid>
        <View
          style={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
       >
          <Text style={{fontSize: 24, marginBottom: 20}}>프로필 설정</Text>

          <View
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            {displayImage ? (
              <Image
                source={{uri: displayImage}}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  marginBottom: 20,
                }}
              />
            ) : (
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: '#ddd',
                  marginBottom: 20,
                }}
              />
            )}

            <Button title="갤러리에서 선택" onPress={selectImage} />
            <Button title="카메라로 촬영" onPress={takePhoto} />
          </View>


          {/* 닉네임 입력 */}
          <Text
            style={{fontSize: 16, marginBottom: 10, alignSelf: 'flex-start'}}>
            닉네임
          </Text>
          <TextInput
            style={{
              width: '100%',
              height: 50,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 10,
              marginBottom: 20,
            }}
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChangeText={setNickname}
          />

          {/* 자기소개 입력 */}
          <Text
            style={{fontSize: 16, marginBottom: 10, alignSelf: 'flex-start'}}>
            자기소개
          </Text>
          <TextInput
            style={{
              width: '100%',
              height: 100,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 10,
              marginBottom: 20,
              textAlignVertical: 'top',
            }}
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
     
        </View>
        </KeyboardAvoid>
  );
};

export default ProfileScreen;
