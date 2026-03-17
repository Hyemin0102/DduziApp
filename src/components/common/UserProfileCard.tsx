import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text} from 'react-native';
import {UserProfile} from '../../@types/auth';
import * as S from './UserProfileCard.style';
import {MY_PAGE_ROUTES, POST_ROUTES} from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {supabase} from '@/lib/supabase';

interface UserProfileCardProps {
  userId: string | null;
  isMyPage: boolean;
  onAddPost?: () => void; // PostsScreen 에서 주입
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  isMyPage,
  userId,
  onAddPost,
}) => {
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
        const {data, error} = await supabase
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

  if (loading) return <ActivityIndicator size="small" color="#6b4fbb" />;
  if (!userId || !user) return <Text>프로필을 불러올 수 없습니다</Text>;

  return (
    <S.Container>
      {/* 프로필 이미지 + 정보 */}
      <S.Wrapper>
        {user.profile_image ? (
          <S.ProfileImage source={{uri: user.profile_image}} />
        ) : (
          <S.ProfileImagePlaceholder>
            <S.ProfileImagePlaceholderText>
              {user.nickname?.charAt(0) || '?'}
            </S.ProfileImagePlaceholderText>
          </S.ProfileImagePlaceholder>
        )}
        <S.InfoContainer>
          <S.Name>{user.nickname || '이름 없음'}</S.Name>
          {user.bio ? <S.ProviderText>{user.bio}</S.ProviderText> : null}
        </S.InfoContainer>
      </S.Wrapper>

      {/* 내 페이지일 때: 프로필 수정 + 게시물 추가 버튼 */}
      {isMyPage && (
        <S.ButtonRow>
          <S.OutlineButton
            onPress={() => navigation.navigate(MY_PAGE_ROUTES.PROFILE_EDIT)}
            style={{flex: 1}}>
            <S.OutlineButtonText>프로필 수정</S.OutlineButtonText>
          </S.OutlineButton>

          <S.FillButton onPress={onAddPost} style={{flex: 1}}>
            <S.FillButtonIcon>+</S.FillButtonIcon>
            <S.FillButtonText>게시물</S.FillButtonText>
          </S.FillButton>
        </S.ButtonRow>
      )}
    </S.Container>
  );
};

export default UserProfileCard;
