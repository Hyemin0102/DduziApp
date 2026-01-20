//users DB 관련 함수

import { supabase } from "../supabase";
import {
  UserProfile,
  KakaoUserProfile,
  GoogleUserProfile,
  NaverUserProfile,
} from '../../@types/auth';



const DEFAULT_IMAGE_COUNT = 5;

// 🔥 Supabase Auth 데이터 + DB 데이터로 UserProfile 생성
interface CreateUserProfileParams {
  supabaseUser: any; // Supabase Auth User 객체
  dbUser: any; // users 테이블 데이터
  provider: 'kakao' | 'google' | 'naver';
  rawProfile: KakaoUserProfile | GoogleUserProfile | NaverUserProfile;
}

//기본 이미지 중 랜덤 지정
export const getRandomDefaultImageUrl = (): string => {
  const randomNum = Math.floor(Math.random() * DEFAULT_IMAGE_COUNT) + 1;
  
  const {data} = supabase.storage
    .from('profile')
    .getPublicUrl(`default/profile_${randomNum}.png`);

  return data.publicUrl;
};

// dduzi + 닉네임 생성
export const generateUsername = (nickname: string | undefined, userId: string): string => {
  if (nickname) {
    // 특수문자 제거하고 dduzi 붙이기
    const cleanNickname = nickname.replace(/[^a-zA-Z0-9가-힣]/g, '');
    return `dduzi${cleanNickname}`;
  }
  // 닉네임 없으면 userId 일부 사용
  return `dduzi${userId.substring(0, 8)}`;
};

// 🔥 users 테이블에 데이터 저장/업데이트
export const createOrUpdateUser = async (
  user: any,
  profile?: {
    nickname?: string;
    profileImageUrl?: string;
  }
): Promise<{ user: any; isNewUser: boolean }> => {
  try {

    // 1. 기존 사용자 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ 사용자 조회 에러:', fetchError);
      throw fetchError;
    }


    if (!existingUser) {
      // 🔥 신규 사용자 생성
      // const username = generateUsername(
      //   profile?.nickname || user.user_metadata?.name,
      //   user.id
      // );
      
      const defaultImageUrl = getRandomDefaultImageUrl();

      //테이블 insert
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username:  profile?.nickname || user.user_metadata?.name,
          bio: null, 
          profile_image: defaultImageUrl,
          provider: user.app_metadata?.provider,
          last_username_update: new Date(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ 사용자 생성 에러:', insertError);
        throw insertError;
      }

      console.log('✅ 신규 사용자 생성 완료:', newUser);
      return { user: newUser, isNewUser: true };
    } else {
      // 🔥 기존 사용자 업데이트

      const profileImageToUse = existingUser.profile_image 
      ? existingUser.profile_image  // 기존 이미지가 있으면 덮어쓰지 않음
      : (profile?.profileImageUrl ||  // 없을 때만 카카오 프로필 사용
         user.user_metadata?.profile_image ||
         user.user_metadata?.picture);
      console.log('profileImageToUse',profileImageToUse);
      


      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          profile_image: profileImageToUse,
          provider: user.app_metadata?.provider || existingUser.provider,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ 사용자 업데이트 에러:', updateError);
        throw updateError;
      }

      console.log('✅ 기존 사용자 업데이트 완료:', updatedUser);
      return { user: updatedUser, isNewUser: false };
    }
  } catch (error) {
    console.error('❌ createOrUpdateUser 에러:', error);
    throw error;
  }
};

// 🔥 UserProfile 객체 재구성
export const createUserProfile = ({
  supabaseUser,
  dbUser,
  provider,
  rawProfile,
}: CreateUserProfileParams): UserProfile => {
  const baseProfile = {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    nickname: dbUser.username || '',
    bio: dbUser.bio || null,
    provider,
  };

  if (provider === 'kakao') {
    const kakaoProfile = rawProfile as KakaoUserProfile;

    
    return {
      ...baseProfile,
      name: supabaseUser.user_metadata?.name,
      profileImage:
        dbUser.profile_image ||
        kakaoProfile.profileImageUrl ||
        kakaoProfile.thumbnailImageUrl,
      rawProfile: { id: kakaoProfile.id } as KakaoUserProfile,
    };
  } else if (provider === 'google') {
    const googleProfile = rawProfile as GoogleUserProfile;
    console.log('googleProfile',googleProfile);
    return {
      ...baseProfile,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      profileImage: dbUser.profile_image ||  supabaseUser.user_metadata?.picture,
      rawProfile: { id: googleProfile.id } as GoogleUserProfile,
    };
  } else {
    // Naver
    const naverProfile = rawProfile as NaverUserProfile;
    return {
      ...baseProfile,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      profileImage: dbUser.profile_image || naverProfile.profile_image || supabaseUser.user_metadata?.picture,
      rawProfile: { id: naverProfile.id } as NaverUserProfile,
    };
  }
};

// 🔥 사용자 정보 조회
export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('사용자 조회 에러:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getUserById 에러:', error);
    return null;
  }
};

// 🔥 사용자 이름 업데이트
export const updateUsername = async (userId: string, newUsername: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        username: newUsername,
        last_username_update: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('사용자 이름 업데이트 에러:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateUsername 에러:', error);
    throw error;
  }
};
