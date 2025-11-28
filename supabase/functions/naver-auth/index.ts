import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'


declare type SupabaseClient = ReturnType<typeof createClient>;
declare type NaverUserProfile = any; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PROD 환경 변수
const prodSupabaseUrl = 'https://aaeqoryqxtkcovplmpyx.supabase.co';
const prodServiceKey = Deno.env.get('ADMIN_SECRET') ?? '';

// Local 환경 변수
const localSupabaseUrl = Deno.env.get('LOCAL_SUPABASE_URL') ?? ''; 
const localServiceKey = Deno.env.get('LOCAL_SERVICE_KEY') ?? '';


// ⭐️ RPC 유틸리티 함수: ID 복구에 사용 (PROD DB에 정의되어 있어야 함) ⭐️
async function getUserIdByEmailRPC(supabaseAdmin: SupabaseClient, email: string): Promise<string | null> {
  const rpcClient = createClient(prodSupabaseUrl, prodServiceKey); 
  const { data, error } = await rpcClient.rpc('get_user_id_by_email', { p_email: email }); 
  if (error) {
      console.error('getUserIdByEmailRPC error:', error);
      return null;
  }
  return data; 
}


// ⭐️ 네이버 프로필 정보 조회 함수 ⭐️
async function fetchNaverProfile(accessToken: string): Promise<NaverUserProfile | null> {
    const naverProfileUrl = 'https://openapi.naver.com/v1/nid/me';

    const response = await fetch(naverProfileUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        console.error('Failed to fetch Naver profile. Status:', response.status);
        return null;
    }

    const data = await response.json();
    
    if (data.resultcode !== '00' || !data.response) {
        console.error('Naver API returned error:', data.message);
        return null;
    }
    
    return data.response;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 클라이언트로부터 네이버 Access Token 받음
    const { naverAccessToken } = await req.json();

    // 네이버 프로필 조회
    const naverProfile = await fetchNaverProfile(naverAccessToken);
    if (!naverProfile || !naverProfile.email) {
        throw new Error("Failed to retrieve essential profile data from Naver API.");
    }

    const naverId = naverProfile.id;
    const email = naverProfile.email;
    const profileUrl = naverProfile.profile_image;
    const username = naverProfile.nickname || naverProfile.name || `naver_user_${naverId}`;

    
    // 실행 환경 및 클라이언트 설정
    const isLocal = req.headers.get('host')?.includes('localhost') || req.headers.get('host')?.includes('127.0.0.1');
    
    let currentSupabaseUrl = prodSupabaseUrl;
    let currentServiceKey = prodServiceKey;
    
    if (isLocal) {
      currentSupabaseUrl = localSupabaseUrl;
      currentServiceKey = localServiceKey;
    }
    
    const supabaseAdmin = createClient(currentSupabaseUrl, currentServiceKey);

    let userId: string
    let isNewUser: boolean = false; 
    let existingAuthUser = null;

    // 기존 사용자 확인 (인증 시스템)
    try {
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
      
      const { data: profile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle() 
      
      existingProfile = profile;
    }

    // 프로필 업데이트 또는 생성
    if (!authUserExists || !existingProfile) {
      // 신규 유저 또는 프로필 없는 유저: 최초 생성/ID 확보
      
      if (!authUserExists) {
        isNewUser = true;

        const { data: newAuthUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: { naver_id: naverId }, // naverId 저장
          })

        if (createError) {
          if (createError.message.includes("A user with this email address has already been registered")) {
            console.warn(`Duplicate email detected. Attempting ID retrieval via RPC.`);
            
            const existingUserId = await getUserIdByEmailRPC(supabaseAdmin, email); // RPC 사용
        
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
      
      // public.users에 프로필 Upsert (PROD 또는 Local DB)
      const defaultUsername = username; // 네이버에서 받은 닉네임을 기본값으로 사용
      
      const { error: profileUpsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        username: defaultUsername, 
        avatar_url: profileUrl,
        last_username_update: new Date().toISOString(),
        provider: 'naver',
      }, { onConflict: 'id' }) 
        
      if (profileUpsertError) throw profileUpsertError
    }
    
    // --- ⭐️ Custom JWT 생성 및 반환 ⭐️ ---
    
    // 5-A. admin.generateLink를 사용하여 JWT 생성
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink', 
        email: email,
        options: {
            redirectTo: 'http://dummy.url', 
        }
    });

    if (linkError) {
        throw new Error(`Failed to generate magiclink for user ID ${userId}: ${linkError.message}`);
    }

    const url = new URL(linkData.properties.action_link);
    const customJwt = url.searchParams.get('token');

    if (!customJwt) {
        throw new Error("Could not extract JWT from magiclink URL.");
    }

    // 5-B. 로컬 환경 동기화 (카카오 auth와 동일한 방식)
    if (isLocal) {
        const supabaseLocalAdmin = createClient(localSupabaseUrl, localServiceKey);

        await supabaseLocalAdmin.auth.admin.createUser({
            email: email,
            id: userId, 
            email_confirm: true,
        }).catch((err) => {
            if (!err.message.includes('A user with this email address has already been registered')) {
                console.warn('Local Auth User Creation Warning:', err.message);
            }
        });

        await supabaseLocalAdmin
            .from('users')
            .upsert(
                {
                    id: userId,
                    username: username, 
                    avatar_url: profileUrl,
                    last_username_update: new Date().toISOString(),
                    provider: 'naver',
                },
                {onConflict: 'id'}
            ).catch((err) => {
                 console.error('Local DB Sync Upsert Error:', err.message);
            });
    }

    // 6. 응답: 생성된 JWT를 포함하여 반환
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        is_new_user: isNewUser,
        custom_jwt: customJwt, // ⭐️ 클라이언트가 로그인에 사용할 JWT ⭐️
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