// Google Play 환불/취소 확인 — 소모성(consumable) 상품은 실시간 알림(RTDN)이 아니라
// Voided Purchases API를 주기적으로 조회해서 확인해야 함. pg_cron으로 하루 1~2회
// 호출하도록 스케줄을 걸어서 씀(마이그레이션으로 cron 등록, 이 파일은 함수 본체만).
//
// 필요한 환경변수(Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INTERNAL_FUNCTION_SECRET
//   GOOGLE_IAP_CLIENT_EMAIL, GOOGLE_IAP_PRIVATE_KEY, GOOGLE_PACKAGE_NAME
//
// TODO: 지금은 매번 최근 30일치를 다시 훑는 방식이라 느슨함(조회만 하고 상태 변경은
// status='active'인 것만 바꾸니 중복 처리는 안전함). 트래픽이 늘면 마지막 동기화
// 시각을 저장해두고 그 이후만 조회하도록 바꾸는 게 좋음.

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function base64url(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let str = '';
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    false,
    ['sign'],
  );
}

async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GOOGLE_IAP_CLIENT_EMAIL')!;
  const privateKeyPem = Deno.env.get('GOOGLE_IAP_PRIVATE_KEY')!.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = {alg: 'RS256', typ: 'JWT'};
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;
  const key = await importRsaPrivateKey(privateKeyPem);
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
  if (!tokenRes.ok) throw new Error(`Google OAuth token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

interface VoidedPurchase {
  purchaseToken: string;
  voidedTimeMillis: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    // 이 함수는 pg_cron(net.http_post)만 호출해야 함 — Supabase의 새 API 키 포맷
    // (sb_secret_...)은 verify_jwt 게이트웨이 체크를 못 통과하므로, send-push-fcm과
    // 동일하게 --no-verify-jwt로 배포하고 여기서 자체 비밀값으로 검증함
    const providedSecret = req.headers.get('x-internal-secret');
    if (!providedSecret || providedSecret !== Deno.env.get('INTERNAL_FUNCTION_SECRET')) {
      return new Response(JSON.stringify({error: 'Forbidden'}), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const packageName = Deno.env.get('GOOGLE_PACKAGE_NAME')!;
    const accessToken = await getGoogleAccessToken();

    // Google API가 정확히 30일 전 timestamp를 "30일 범위 밖"으로 거부하는 경계값 문제가 있어
    // 29일로 약간 여유를 둠
    const startTimeMillis = Date.now() - 29 * 24 * 60 * 60 * 1000;
    const res = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/voidedpurchases?startTime=${startTimeMillis}&maxResults=1000`,
      {headers: {Authorization: `Bearer ${accessToken}`}},
    );
    if (!res.ok) {
      throw new Error(`Google voided purchases lookup failed: ${res.status} ${await res.text()}`);
    }
    const {voidedPurchases = []} = (await res.json()) as {voidedPurchases?: VoidedPurchase[]};

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let updatedCount = 0;
    for (const voided of voidedPurchases) {
      const {error, count} = await adminSupabase
        .from('supporter_purchases')
        .update(
          {
            status: 'refunded',
            refunded_at: new Date(Number(voided.voidedTimeMillis)).toISOString(),
          },
          {count: 'exact'},
        )
        .eq('store', 'google_play')
        .eq('transaction_id', voided.purchaseToken)
        .eq('status', 'active');
      if (error) throw error;
      updatedCount += count ?? 0;
    }

    return new Response(
      JSON.stringify({checked: voidedPurchases.length, updated: updatedCount}),
      {headers: {...corsHeaders, 'Content-Type': 'application/json'}},
    );
  } catch (error) {
    console.error('google-voided-purchases-sync error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
