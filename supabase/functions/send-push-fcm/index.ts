import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Google 서비스 계정 개인키로 JWT를 서명하고 OAuth2 access token으로 교환
// (Deno 환경엔 firebase-admin(Node 전용) 대신 Web Crypto로 직접 구현)
function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let str = '';
  bytes.forEach(b => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    false,
    ['sign'],
  );
}

async function getAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = {alg: 'RS256', typ: 'JWT'};
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;
  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    {name: 'RSASSA-PKCS1-v1_5'},
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`OAuth token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function sendFcmMessage(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  badge: number,
  data?: Record<string, string>,
): Promise<Response> {
  return fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {title, body},
        data: data ?? {},
        // iOS 앱 아이콘 뱃지는 OS가 자동으로 올려주지 않고, 매 푸시마다 서버가
        // "지금 몇 개여야 하는지" 절대값을 넣어줘야만 표시됨 — 그래서 안읽은
        // 알림 총 개수를 매번 다시 계산해서 넣음(Android는 이 필드 무시하고
        // 알림함에 쌓인 개수로 자체 처리하므로 영향 없음)
        apns: {payload: {aps: {badge}}},
      },
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    // 이 함수는 DB 트리거(pg_net)만 호출해야 함 — 일반 로그인 유저 토큰으로 호출되면
    // 임의 유저에게 푸시를 보낼 수 있어 반드시 차단.
    // Supabase의 service_role/secret 키는 프로젝트마다 형식(레거시 JWT vs 신규 sb_secret_)이
    // 달라 혼동하기 쉬우므로, 여기서만 쓰는 별도의 내부 비밀값으로 비교함
    const providedSecret = req.headers.get('x-internal-secret');
    if (!providedSecret || providedSecret !== Deno.env.get('INTERNAL_FUNCTION_SECRET')) {
      return new Response(JSON.stringify({error: 'Forbidden'}), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const {userIds, title, body, data} = await req.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({error: 'userIds required'}), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const {data: tokenRows, error} = await supabaseAdmin
      .from('device_tokens')
      .select('token, user_id')
      .in('user_id', userIds);
    if (error) throw error;
    if (!tokenRows || tokenRows.length === 0) {
      return new Response(JSON.stringify({sent: 0, total: 0}), {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    // 유저별 안읽은 알림 개수를 미리 집계해서 뱃지 숫자로 사용(이 함수가 호출되는
    // 시점엔 이번에 보낼 알림이 이미 DB에 insert된 뒤이므로 그 알림도 포함됨)
    const {data: unreadRows, error: unreadError} = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .eq('is_read', false)
      .in('user_id', userIds);
    if (unreadError) throw unreadError;
    const badgeByUser = new Map<string, number>();
    (unreadRows ?? []).forEach(({user_id}) => {
      badgeByUser.set(user_id, (badgeByUser.get(user_id) ?? 0) + 1);
    });

    const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;
    const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n');
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID')!;

    const accessToken = await getAccessToken(clientEmail, privateKey);

    const results = await Promise.allSettled(
      tokenRows.map(async ({token, user_id}) => {
        const res = await sendFcmMessage(
          accessToken,
          projectId,
          token,
          title,
          body,
          badgeByUser.get(user_id) ?? 0,
          data,
        );
        // badge가 왜 안 뜨는지 추적하려고 FCM 응답을 항상 로그에 남김(성공 응답이어도
        // apns 관련 필드가 조용히 무시/거부될 수 있어서 바디까지 확인 필요)
        const resText = await res.clone().text();
        console.log(`FCM response (user=${user_id}, badge=${badgeByUser.get(user_id) ?? 0}): ${res.status} ${resText}`);
        return res;
      }),
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    return new Response(
      JSON.stringify({sent, total: tokenRows.length}),
      {headers: {...corsHeaders, 'Content-Type': 'application/json'}},
    );
  } catch (error) {
    console.error('send-push-fcm error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
