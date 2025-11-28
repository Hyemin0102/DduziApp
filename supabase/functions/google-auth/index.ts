import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 헤더 설정
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


// ⭐️ RPC 유틸리티 함수: 이메일로 사용자 ID를 조회합니다. ⭐️
// (DB에 get_user_id_by_email RPC 함수가 정의되어 있어야 합니다.)
async function getUserIdByEmailRPC(supabaseAdmin: SupabaseClient, email: string): Promise<string | null> {
  // rpc 호출 시 DB 함수에서 정의한 인자 이름(p_email) 사용을 가정
  const { data, error } = await supabaseAdmin.rpc('get_user_id_by_email', { p_email: email }); 

  if (error) {
      console.error('getUserIdByEmail RPC error', error);
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
    // 클라이언트에서 전달받은 데이터
    const { email, username, profileUrl } = await req.json()

    if (!email) {
        return new Response(JSON.stringify({ error: 'Missing email in request body' }), { status: 400 });
    }
    
    // 환경 감지 및 클라이언트 설정
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
    
    let userId: string;

    // 1. Supabase Auth에서 사용자 ID 조회 (RPC 사용)
    const prodRpcClient = createClient(prodSupabaseUrl, prodServiceKey); // RPC는 PROD DB를 바라봄
    const existingUserId = await getUserIdByEmailRPC(prodRpcClient, email); // ⭐️ getUserByEmail 대신 RPC 사용 ⭐️


    if (!existingUserId) {
        // 사용자가 Auth DB에 아직 없는 경우 (첫 로그인 시점).
        // 클라이언트의 signInWithIdToken 호출 시 사용자가 생성될 예정이므로, DB 동기화를 건너뜁니다.
        console.warn(`Auth user not yet provisioned for ${email}. Skipping DB sync.`);
        
        return new Response(
            JSON.stringify({
                success: true,
                message: 'DB Sync skipped. User will be provisioned by client.',
                user_id: null,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    }
    
    userId = existingUserId;
    
    // 2. Local DB (users 테이블) 동기화 (Upsert)
    
    // users 테이블은 userId가 확보된 경우에만 업데이트합니다.
    const defaultUsername = username ?? `google_user_${Math.floor(Math.random() * 10000)}`; 

    const { error: profileUpsertError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: userId,
            email: email, // 이메일 필드도 추가
            username: defaultUsername, 
            avatar_url: profileUrl,
            last_username_update: new Date().toISOString(),
            provider: 'google',
        }, { onConflict: 'id' }) 
        
    if (profileUpsertError) {
        throw profileUpsertError;
    }


    // ⭐️ 3. 로컬 환경일 경우 로컬 DB에 추가 동기화 (Auth 및 Users)
    if (isLocal) {
      const supabaseLocalAdmin = createClient(localSupabaseUrl, localServiceKey);

      // 로컬 auth.users에 유저 강제 생성 (409 동일 유저 에러 무시)
      await supabaseLocalAdmin.auth.admin.createUser({
          email: email,
          id: userId, // PROD에서 확보한 ID 사용
          email_confirm: true,
      }).catch((err) => {
          // 이미 등록된 이메일 에러는 무시
          if (!err.message.includes('A user with this email address has already been registered')) {
              console.warn('Local Auth User Creation Warning:', err.message);
          }
      });

      // 로컬 public.users에 프로필 Upsert (이메일 필드 추가)
      const { error: localUpsertError } = await supabaseLocalAdmin
          .from('users')
          .upsert(
              {
                  id: userId,
                  email: email, 
                  username: defaultUsername, 
                  avatar_url: profileUrl,
                  last_username_update: new Date().toISOString(),
                  provider: 'google',
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
        message: 'Auth user found and DB sync successful',
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