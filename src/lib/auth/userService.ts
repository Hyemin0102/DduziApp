//users DB 관련 함수

import { supabaseAuth } from "../supabase";



// 랜덤 기본 이미지 ID 생성 (1~10)
export const getRandomDefaultImageId = (): number => {
  return Math.floor(Math.random() * 10) + 1;
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
) => {
  try {
    console.log('👤 사용자 정보 저장 시작...', user.id);

    // 1. 기존 사용자 확인
    const { data: existingUser, error: fetchError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = 데이터 없음 (정상)
      console.error('❌ 사용자 조회 에러:', fetchError);
      throw fetchError;
    }



    // 2. 프로필 이미지 URL 결정
    const avatarUrl =
      profile?.profileImageUrl ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.profile_image;

    if (!existingUser) {
      // 🔥 신규 사용자 생성
      const username = generateUsername(
        profile?.nickname || user.user_metadata?.name,
        user.id
      );

      console.log('🆕 신규 사용자 생성 중...', { username, avatarUrl });

      const { data: newUser, error: insertError } = await supabaseAuth
        .from('users')
        .insert({
          id: user.id, // auth.users.id와 동일
          username: username,
          bio: null,
          default_image_id: getRandomDefaultImageId(),
          avatar_url: avatarUrl,
          provider: user.app_metadata?.provider || 'kakao',
          last_username_update: new Date(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ 사용자 생성 에러:', insertError);
        throw insertError;
      }

      console.log('✅ 신규 사용자 생성 완료:', newUser);
      return newUser;
    } else {
      // 🔥 기존 사용자 업데이트 (프로필 이미지, provider만 업데이트)
      console.log('🔄 기존 사용자 업데이트 중...', existingUser.id);

      const { data: updatedUser, error: updateError } = await supabaseAuth
        .from('users')
        .update({
          avatar_url: avatarUrl,
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
      return updatedUser;
    }
  } catch (error) {
    console.error('❌ createOrUpdateUser 에러:', error);
    // 에러를 throw해서 상위에서 처리할 수 있게 함
    throw error;
  }
};

// 🔥 사용자 정보 조회
export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabaseAuth
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
    const { data, error } = await supabaseAuth
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
