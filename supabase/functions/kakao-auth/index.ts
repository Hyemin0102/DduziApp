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

   
    const isLocal = req.headers.get('host')?.includes('localhost') || req.headers.get('host')?.includes('127.0.0.1');
    
    let currentSupabaseUrl = prodSupabaseUrl;
    let currentServiceKey = prodServiceKey;
    
    if (isLocal) {
      
      currentSupabaseUrl = localSupabaseUrl;
      currentServiceKey = localServiceKey;
      console.log("Running in Local Development Environment. Syncing with local DB.");
    }
    
    // Service Role Key를 사용하여 관리자 클라이언트 생성 (PROD 또는 Local)
    const supabaseAdmin = createClient(currentSupabaseUrl, currentServiceKey);

    let userId: string
    let isNewUser: boolean = false; 
    let existingAuthUser = null;


    try {
      //기존 사용자 확인
      const { data } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      existingAuthUser = data;
    } catch (error) {
      console.log(`User not found for ${email}. Proceeding to create/find ID.`);
    }


    let existingProfile = null;
    let authUserExists = false; 

    if (existingAuthUser?.user) {
      authUserExists = true;
      userId = existingAuthUser.user.id;
      isNewUser = false;
      
      //users 테이블에서 기존 유저의 모든 칼럼 가져와서 프로필 업데이트
      const { data: profile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle() 
      
      existingProfile = profile;
    }

    if (authUserExists && existingProfile) {
      //기존 유저 & 기존 프로필인 경우
      console.log(`User ${userId} logged in. Profile update skipped.`);
      
    } else {
      // 신규 유저, 프로필 없는 경우
      if (!authUserExists) {
        //신규 유저인 경우
        isNewUser = true;

        //supabase auth에 user 등록
        const { data: newAuthUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: { kakao_id: kakaoId },
          })

        if (createError) {
          //이미 Auth 에 등록된 유저인 경우
          if (createError.message.includes("A user with this email address has already been registered")) {
            console.warn(`Duplicate email detected. Attempting ID retrieval via RPC.`);
            
            // ⭐️ RPC 함수를 사용한 ID 복구 (PROD 환경에서만 RPC 함수가 동작함) ⭐️
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
          //신규 유저인 경우 Auth user의 id 확보
          userId = newAuthUser.user.id
        }
      }
      
      // userId가 확보되었으므로 Upsert 진행 (PROD 또는 Local)
      const defaultUsername = `dduzi_${Math.floor(Math.random() * 10000)}` 
      
      //id값이 이미 존재하면 새로운 값으로 업데이트, 없으면 새로운 유저 추가
      const { error: profileUpsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        username: defaultUsername, 
        avatar_url: profileUrl,
        last_username_update: new Date().toISOString(),
        provider: 'kakao',
      }, { onConflict: 'id' }) 
        
      if (profileUpsertError) throw profileUpsertError
    }
    
    // ⭐️ 로컬 환경일 경우 로컬 DB에 추가 동기화
    if (isLocal) {
      const supabaseLocalAdmin = createClient(localSupabaseUrl, localServiceKey);

      // 로컬 auth.users에 유저 강제 생성 (409 동일 유저 에러 무시)
      await supabaseLocalAdmin.auth.admin.createUser({
          email: email,
          id: userId, // PROD에서 확보한 ID 사용
          email_confirm: true,
      }).catch((err) => {
          if (!err.message.includes('A user with this email address has already been registered')) {
              console.warn('Local Auth User Creation Warning:', err.message);
          }
      });

      // 로컬 public.users에 프로필 Upsert
      const { error: localUpsertError } = await supabaseLocalAdmin
          .from('users')
          .upsert(
              {
                  id: userId,
                  username: username, 
                  avatar_url: profileUrl,
                  last_username_update: new Date().toISOString(),
                  provider: 'kakao',
              },
              {onConflict: 'id'}
          );
      
      if (localUpsertError) {
           console.error('Local DB Sync Upsert Error:', localUpsertError.message);
      } else {
           console.log('Successfully synced user profile to local DB.');
      }
    }


    // 최종 응답
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