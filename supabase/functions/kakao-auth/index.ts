import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = 'https://aaeqoryqxtkcovplmpyx.supabase.co';
const serviceKey = Deno.env.get('ADMIN_SECRET') ?? '';

export async function getUserIdByEmail(email: string): Promise<string | null> {
  
  const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey); 
  
  // rpc 호출 시 DB 함수에서 정의한 인자 이름(p_email) 사용
  const { data, error } = await supabase.rpc('get_user_id_by_email', { p_email: email }); 

  if (error) {
      console.error('getUserIdByEmail error', error);
      return null;
  }

  // 결과가 UUID 형태의 문자열로 반환됨
  return data; 
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { kakaoId, email, username, profileUrl } = await req.json()



    // Service Role Key를 사용하여 관리자 클라이언트 생성
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    let userId: string
    let isNewUser: boolean = false; 
    let existingAuthUser = null;

    // 1. 기존 사용자 확인 (SDK 사용)
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      existingAuthUser = data;
    } catch (error) {
      // 유저가 없으면(404) catch로 빠지고, 아래 생성 로직으로 진행
      console.log(`User not found for ${email}. Proceeding to create/find ID.`);
    }

    let existingProfile = null;
    let authUserExists = false; 

    if (existingAuthUser?.user) {
      // 2. Auth 유저가 확인된 경우
      authUserExists = true;
      userId = existingAuthUser.user.id;
      isNewUser = false;
      
      // public.users 프로필 조회
      const { data: profile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle() 
      
      existingProfile = profile;
    }

    // 3. 프로필 업데이트 또는 생성
    if (authUserExists && existingProfile) {
      // 3-A. 기존 유저 & 기존 프로필: 업데이트 방지 (패스)
      console.log(`User ${userId} logged in. Profile update skipped.`);
      
    } else {
      // 3-B. 신규 유저 또는 프로필 없는 유저: 최초 생성/ID 확보
      
      if (!authUserExists) {
        // 유저가 없다고 판단됨 -> 생성 시도
        isNewUser = true;

        const { data: newAuthUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: { kakao_id: kakaoId },
          })

        if (createError) {
          if (createError.message.includes("A user with this email address has already been registered")) {
            console.warn(`Duplicate email detected. Attempting ID retrieval via RPC.`);
            
            // ⭐️ 불안정한 SDK 호출 대신 RPC 함수 사용 ⭐️
            const existingUserId = await getUserIdByEmail(email); 
        
            if (existingUserId) {
                userId = existingUserId;
                isNewUser = false; 
            } else {
                // RPC가 실패하면 Auth 유저는 있는데 ID를 찾을 수 없는 최종 오류
                throw new Error("Critical: Auth user exists but ID could not be retrieved via RPC.");
            }
          } else {
            throw createError 
          }
        } else {
          userId = newAuthUser.user.id
        }
      }
      
      // userId가 확보되었으므로 Upsert 진행
      const defaultUsername = `dduzi_${Math.floor(Math.random() * 10000)}` 
      
      // public.users에 프로필 Upsert (최초 생성 시에만 이미지 저장)
      const { error: profileUpsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        username: defaultUsername, 
        avatar_url: profileUrl,
        last_username_update: new Date().toISOString(),
      }, { onConflict: 'id' }) 
        
      if (profileUpsertError) throw profileUpsertError
    }

    // 4. 응답
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        is_new_user: isNewUser,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Failed to provision user: ' + error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})