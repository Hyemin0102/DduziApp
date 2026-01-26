import React, { useEffect, useState } from 'react';
import {UserProfile} from '../../@types/auth';
import * as S from './UserProfileCard.style';
import { MY_PAGE_ROUTES } from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import { supabase } from '@/lib/supabase';
import { ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';


interface UserProfileCardProps {
  userId: string | null;
  isMyPage: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ isMyPage, userId}) => {
  const {navigation} = useCommonNavigation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setUser(data);
      } catch (error) {
        console.error('❌ 프로필 로드 실패:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // 로딩 중
  if (loading) {
    return <ActivityIndicator size="small" color="#007AFF" />;
  }

  // userId가 없거나 user를 못 불러온 경우
  if (!userId || !user) {
    return <Text>프로필을 불러올 수 없습니다</Text>;
  }

  return (
    <S.Container>
    <S.Wrapper>
      {/* 프로필 이미지 */}
      {user.profile_image ? (
        <S.ProfileImage source={{uri: user.profile_image}} />
      ) : (
        <S.ProfileImagePlaceholder>
          <S.ProfileImagePlaceholderText>
            {user.nickname?.charAt(0) || '?'}
          </S.ProfileImagePlaceholderText>
        </S.ProfileImagePlaceholder>
      )}

      {/* 사용자 정보 */}
      <S.InfoContainer>
        <S.Name>{user.nickname || '이름 없음'}</S.Name>

        {/* 자기소개 */}

          <S.ProviderText>{user.bio}</S.ProviderText>

      </S.InfoContainer>

    </S.Wrapper>
{
  isMyPage && (
    <S.EditProfileButton onPress={() => navigation.navigate(MY_PAGE_ROUTES.PROFILE_EDIT)}>
    <S.EditProfileButtonText>프로필 수정</S.EditProfileButtonText>
  </S.EditProfileButton>
  )
}
 
    </S.Container>
  );
};

export default UserProfileCard;
