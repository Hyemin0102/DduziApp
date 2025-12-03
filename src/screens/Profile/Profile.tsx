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
import {getDefaultImageById} from '../../lib/auth/userService';
import {useAuth} from '../../contexts/AuthContext';
import {supabaseAuth} from '../../lib/supabase';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../@types/route';
import {ScrollView} from 'react-native-gesture-handler';

const ProfileScreen = () => {
  const {user} = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  //프로필 수정(bio, name)
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text>사용자 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const defaultImage = getDefaultImageById(user.defaultImageId || 1);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // bio 업데이트
      const {error} = await supabaseAuth
        .from('users')
        .update({
          username: nickname,
          bio: bio,
        })
        .eq('id', user.id);

      if (error) throw error;

      // 프로필 설정 완료 플래그 제거
      await AsyncStorage.removeItem('needsProfileSetup');

      console.log('✅ 프로필 설정 완료 - Home으로 이동');

      // Home으로 이동 (Navigator가 자동으로 처리)
      // navigation.reset({
      //   index: 0,
      //   routes: [{name: 'TabNavigator'}],
      // });
    } catch (error) {
      console.error('프로필 저장 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled">
          <Text style={{fontSize: 24, marginBottom: 20}}>프로필 설정</Text>

          <Image
            source={defaultImage}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              marginBottom: 20,
            }}
          />

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
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;
