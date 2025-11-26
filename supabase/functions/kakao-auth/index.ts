import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PROD 환경 변수 (배포 환경에서 사용)
const prodSupabaseUrl = 'https://aaeqoryqxtkcovplmpyx.supabase.co';
const prodServiceKey = Deno.env.get('ADMIN_SECRET') ?? '';

// Local 환경 변수 (로컬 개발 환경에서 사용)
const localSupabaseUrl = Deno.env.get('LOCAL_SUPABASE_URL') ?? ''; 
const localServiceKey = Deno.env.get('LOCAL_SERVICE_KEY') ?? '';


// ⭐️ RPC 유틸리티 함수: Deno.serve 안에서 사용될 예정이므로, 
//    별도의 클라이언트 생성을 피하고 인자로 받은 Admin 클라이언트를 사용하도록 변경합니다. ⭐️
async function getUserIdByEmailRPC(supabaseAdmin: SupabaseClient, email: string): Promise<string | null> {
  // rpc 호출 시 DB 함수에서 정의한 인자 이름(p_email) 사용
  const { data, error } = await supabaseAdmin.rpc('get_user_id_by_email', { p_email: email }); 

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

    // ⭐️ 1. 실행 환경 및 클라이언트 설정 ⭐️
    const isLocal = req.headers.get('host')?.includes('localhost') || req.headers.get('host')?.includes('127.0.0.1');
    
    let currentSupabaseUrl = prodSupabaseUrl;
    let currentServiceKey = prodServiceKey;
    
    if (isLocal) {
      // 로컬 환경에서 실행 중이라면 로컬 키/URL로 오버라이드
      currentSupabaseUrl = localSupabaseUrl;
      currentServiceKey = localServiceKey;
      console.log("Running in Local Development Environment. Syncing with local DB.");
    }
    
    // Service Role Key를 사용하여 관리자 클라이언트 생성 (PROD 또는 Local)
    const supabaseAdmin = createClient(currentSupabaseUrl, currentServiceKey);

    let userId: string
    let isNewUser: boolean = false; 
    let existingAuthUser = null;

    // 2. 기존 사용자 확인 (SDK 사용)
    try {
      // PROD든 Local이든 현재의 Admin 클라이언트 사용
      const { data } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      existingAuthUser = data;
    } catch (error) {
      console.log(`User not found for ${email}. Proceeding to create/find ID.`);
    }

    let existingProfile = null;
    let authUserExists = false; 

    if (existingAuthUser?.user) {
      // 3. Auth 유저가 확인된 경우
      authUserExists = true;
      userId = existingAuthUser.user.id;
      isNewUser = false;
      
      const { data: profile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle() 
      
      existingProfile = profile;
    }

    // 4. 프로필 업데이트 또는 생성
    if (authUserExists && existingProfile) {
      // 4-A. 기존 유저 & 기존 프로필: 업데이트 방지 (패스)
      console.log(`User ${userId} logged in. Profile update skipped.`);
      
    } else {
      // 4-B. 신규 유저 또는 프로필 없는 유저: 최초 생성/ID 확보
      
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
            
            // ⭐️ RPC 함수를 사용한 ID 복구 (PROD 환경에서만 RPC 함수가 동작함) ⭐️
            // 로컬 환경에서는 DB 함수가 정의되어 있지 않을 수 있으므로, PROD 환경에서만 호출합니다.
            const rpcClient = createClient(prodSupabaseUrl, prodServiceKey); // PROD RPC 클라이언트 생성
            const existingUserId = await getUserIdByEmailRPC(rpcClient, email); 
        
            if (existingUserId) {
                userId = existingUserId;
                isNewUser = false; 
            } else {
                throw new Error("Critical: Auth user exists but ID could not be retrieved via RPC.");
            }
          } else {
            throw createError 
          }
        } else {
          userId = newAuthUser.user.id
        }
      }
      
      // userId가 확보되었으므로 Upsert 진행 (PROD 또는 Local)
      const defaultUsername = `dduzi_${Math.floor(Math.random() * 10000)}` 
      
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
    
    // ⭐️ 5. 로컬 환경일 경우 로컬 DB에 추가 동기화 ⭐️
    if (isLocal) {
      const supabaseLocalAdmin = createClient(localSupabaseUrl, localServiceKey);

      // 5-A. 로컬 auth.users에 유저 강제 생성 (409 에러 무시)
      await supabaseLocalAdmin.auth.admin.createUser({
          email: email,
          id: userId, // PROD에서 확보한 ID 사용
          email_confirm: true,
      }).catch((err) => {
          if (!err.message.includes('A user with this email address has already been registered')) {
              console.warn('Local Auth User Creation Warning:', err.message);
          }
      });

      // 5-B. 로컬 public.users에 프로필 Upsert
      const { error: localUpsertError } = await supabaseLocalAdmin
          .from('users')
          .upsert(
              {
                  id: userId,
                  username: username, 
                  avatar_url: profileUrl,
                  last_username_update: new Date().toISOString(),
              },
              {onConflict: 'id'}
          );
      
      if (localUpsertError) {
           console.error('Local DB Sync Upsert Error:', localUpsertError.message);
      } else {
           console.log('Successfully synced user profile to local DB.');
      }
    }


    // 6. 응답
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