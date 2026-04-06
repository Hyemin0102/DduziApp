//users DB 관련 함수

import {supabase} from '../supabase';
import {
  UserProfile,
  KakaoUserProfile,
  GoogleUserProfile,
  AppleUserProfile,
} from '../../@types/auth';

const DEFAULT_IMAGE_COUNT = 5;

// 🔥 Supabase Auth 데이터 + DB 데이터로 UserProfile 생성
interface CreateUserProfileParams {
  supabaseUser: any; // Supabase Auth User 객체
  dbUser: any; // users 테이블 데이터
  provider: 'kakao' | 'google' | 'apple';
  rawProfile:
    | KakaoUserProfile
    | GoogleUserProfile
    | AppleUserProfile;
}

//기본 이미지 중 랜덤 지정
export const getRandomDefaultImageUrl = (): string => {
  const randomNum = Math.floor(Math.random() * DEFAULT_IMAGE_COUNT) + 1;

  const {data} = supabase.storage
    .from('profile')
    .getPublicUrl(`default/profile_${randomNum}.png`);

  return data.publicUrl;
};

// 🔥 users 테이블에 데이터 저장/업데이트
export const createOrUpdateUser = async (
  user: any,
  profile?: {
    nickname?: string;
    profileImageUrl?: string;
  },
  intendedProvider?: string,
): Promise<{user: any; isNewUser: boolean}> => {
  try {
    // 1. 기존 사용자 확인
    const {data: existingUser, error: fetchError} = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ 사용자 조회 에러:', fetchError);
      throw fetchError;
    }

    if (!existingUser) {
      const defaultImageUrl = getRandomDefaultImageUrl();

      //테이블 insert
      const {data: newUser, error: insertError} = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || null,
          nickname: profile?.nickname || user.user_metadata?.name,
          bio: null,
          profile_image: defaultImageUrl,
          provider: user.app_metadata?.provider,
          last_nickname_update: new Date(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ 사용자 생성 에러:', insertError);
        throw insertError;
      }

      console.log('✅ 신규 사용자 생성 완료:', newUser);
      return {user: newUser, isNewUser: true};
    } else {
      // 🔥 기존 사용자 업데이트
      // 다른 provider로 가입된 계정인지 확인
      const providerToCheck = intendedProvider || user.app_metadata?.provider;
      if (
        existingUser.provider &&
        providerToCheck &&
        existingUser.provider !== providerToCheck
      ) {
        throw new Error(`PROVIDER_CONFLICT:${existingUser.provider}`);
      }

      const profileImageToUse = existingUser.profile_image
        ? existingUser.profile_image // 기존 이미지가 있으면 덮어쓰지 않음
        : profile?.profileImageUrl || // 없을 때만 카카오 프로필 사용
          user.user_metadata?.profile_image ||
          user.user_metadata?.picture;

      const {data: updatedUser, error: updateError} = await supabase
        .from('users')
        .update({
          profile_image: profileImageToUse,
          ...(!existingUser.email && user.email ? {email: user.email} : {}),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ 사용자 업데이트 에러:', updateError);
        throw updateError;
      }

      console.log('✅ 기존 사용자 업데이트 완료:', updatedUser);
      return {user: updatedUser, isNewUser: false};
    }
  } catch (error: any) {
    if (!error?.message?.startsWith('PROVIDER_CONFLICT:')) {
      console.error('❌ createOrUpdateUser 에러:', error);
    }
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
    nickname: dbUser.nickname || '', // DB에 저장된 닉네임
    bio: dbUser.bio || null,
    provider,
  };

  if (provider === 'kakao') {
    const kakaoProfile = rawProfile as KakaoUserProfile;

    return {
      ...baseProfile,
      profile_image:
        dbUser.profile_image ||
        kakaoProfile.profileImageUrl ||
        kakaoProfile.thumbnailImageUrl,
      rawProfile: {id: kakaoProfile.id} as KakaoUserProfile,
    };
  } else if (provider === 'google') {
    const googleProfile = rawProfile as GoogleUserProfile;

    return {
      ...baseProfile,
      profile_image:
        dbUser.profile_image || supabaseUser.user_metadata?.picture,
      rawProfile: {id: googleProfile.id} as GoogleUserProfile,
    };
  } else if (provider === 'apple') {
    const appleProfile = rawProfile as AppleUserProfile;
    return {
      ...baseProfile,
      profile_image: dbUser.profile_image || undefined,
      rawProfile: {id: appleProfile.id} as AppleUserProfile,
    };
  } else {
    return {
      ...baseProfile,
      profile_image: dbUser.profile_image || undefined,
      rawProfile: rawProfile,
    };
  }
};

// 🔥 사용자 정보 조회
export const getUserById = async (userId: string) => {
  try {
    const {data, error} = await supabase
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

// 🔥 닉네임 중복 확인
export const checkNicknameDuplicate = async (
  nickname: string,
  currentUserId: string,
): Promise<boolean> => {
  const {data} = await supabase
    .from('users')
    .select('id')
    .eq('nickname', nickname)
    .neq('id', currentUserId)
    .maybeSingle();

  return !!data; // true면 중복
};

// 🔥 사용자 닉네임 업데이트
export const updateNickname = async (userId: string, newNickname: string) => {
  try {
    const {data, error} = await supabase
      .from('users')
      .update({
        nickname: newNickname,
        last_nickname_update: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('닉네임 업데이트 에러:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateNickname 에러:', error);
    throw error;
  }
};
