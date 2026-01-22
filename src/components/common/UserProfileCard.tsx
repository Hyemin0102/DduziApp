import React from 'react';
import {UserProfile} from '../../@types/auth';
import * as S from './UserProfileCard.style';
import { useNavigation } from '@react-navigation/native';
import { MY_PAGE_ROUTES } from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';

interface UserProfileCardProps {
  user: UserProfile;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({user}) => {
  const {navigation} = useCommonNavigation();
  if (!user) {
    return null; // 또는 로딩 상태
  }

  return (
    <S.Container>
    <S.Wrapper>
      {/* 프로필 이미지 */}
      {user.profileImage ? (
        <S.ProfileImage source={{uri: user.profileImage}} />
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
    <S.EditProfileButton onPress={() => navigation.navigate(MY_PAGE_ROUTES.PROFILE_EDIT)}>
        <S.EditProfileButtonText>프로필 수정</S.EditProfileButtonText>
      </S.EditProfileButton>
    </S.Container>
  );
};

export default UserProfileCard;
