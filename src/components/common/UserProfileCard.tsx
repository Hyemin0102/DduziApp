import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Text} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {UserProfile} from '../../@types/auth';
import * as S from './UserProfileCard.style';
import AvatarLevelBadge from './AvatarLevelBadge';
import {MY_PAGE_ROUTES} from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';

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
  const {user: authUser, refreshUserProfile} = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = useRef<string | null>(null);
  const refreshRef = useRef(refreshUserProfile);
  refreshRef.current = refreshUserProfile;

  // 내 페이지 진입 시 DB 기준으로 뱃지 등급 등 최신 정보를 다시 읽음
  useFocusEffect(
    useCallback(() => {
      if (isMyPage) refreshRef.current();
    }, [isMyPage]),
  );

  // 내 페이지면 AuthContext 사용 (프로필 수정 즉시 반영)
  useEffect(() => {
    if (isMyPage && authUser) {
      setUser(authUser);
      setLoading(false);
    }
  }, [isMyPage, authUser]);

  // 다른 유저 프로필은 화면 포커스 시 재조회 (이미 불러온 유저면 스피너 없이 백그라운드 갱신)
  useFocusEffect(
    useCallback(() => {
      if (isMyPage) return;
      const fetchUserProfile = async () => {
        if (!userId) {
          setLoading(false);
          return;
        }
        const isFirstLoad = loadedUserIdRef.current !== userId;
        try {
          if (isFirstLoad) setLoading(true);
          const {data, error} = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          if (error) throw error;
          setUser(data);
          loadedUserIdRef.current = userId;
        } catch (error) {
          console.error('❌ 프로필 로드 실패:', error);
          if (isFirstLoad) setUser(null);
        } finally {
          setLoading(false);
        }
      };
      fetchUserProfile();
    }, [userId, isMyPage]),
  );

  if (loading) return <ActivityIndicator size="small" color="#191919" />;
  if (!userId || !user) return <Text>프로필을 불러올 수 없습니다</Text>;

  console.log('show_supporter_badge',user.show_supporter_badge);
  console.log('supporter_level',user.supporter_level);
  

  return (
    <S.Container>
      {/* 프로필 이미지 + 정보 */}
      <S.Wrapper>
        <AvatarLevelBadge
          size={72}
          level={
            isMyPage || user.show_supporter_badge
              ? user.supporter_level
              : null
          }>
          {user.profile_image ? (
            <S.ProfileImage source={{uri: user.profile_image}} />
          ) : (
            <S.ProfileImagePlaceholder>
              <S.ProfileImagePlaceholderText>
                {user.nickname?.charAt(0) || '?'}
              </S.ProfileImagePlaceholderText>
            </S.ProfileImagePlaceholder>
          )}
        </AvatarLevelBadge>


        <S.InfoContainer>
          <S.NameRow>
            <S.Name>{user.nickname || '이름 없음'}</S.Name>
          </S.NameRow>
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
