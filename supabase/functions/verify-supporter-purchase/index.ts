// 앱 후원(응원) 인앱결제 영수증을 스토어에 직접 검증한 뒤 supporter_purchases에 기록.
// 클라이언트는 구매 직후 이 함수를 호출만 하고, 실제 검증/DB 기록은 전부 서버에서 함
// (클라이언트가 보낸 값을 그대로 믿지 않음).
//
// 필요한 환경변수(Secrets):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (공통, 이미 있을 수 있음)
//   APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY, APPLE_BUNDLE_ID
//     (App Store Connect > Users and Access > Integrations > In-App Purchase 키 발급)
//   GOOGLE_IAP_CLIENT_EMAIL, GOOGLE_IAP_PRIVATE_KEY, GOOGLE_PACKAGE_NAME
//     (Google Cloud Console 서비스 계정, Android Publisher API 권한 필요)
//
// TODO: 실제 발급받은 키로 위 환경변수를 채우기 전까지는 검증 호출이 실패함(동작 안 함).
// 구조만 먼저 잡아둔 상태.

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const SUPPORT_PRODUCT_ID = 'dduzi_support_single';
const SUPPORT_PRICE_KRW = 4400;

type Store = 'app_store' | 'google_play';

interface VerifyRequestBody {
  store: Store;
  productId: string;
  // app_store: App Store Server API의 transactionId
  // google_play: 구매 토큰(purchaseToken) — transaction_id 컬럼에 그대로 저장
  transactionId: string;
}

function base64url(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let str = '';
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecodeToJson(segment: string): any {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
  return JSON.parse(json);
}

async function importEcPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {name: 'ECDSA', namedCurve: 'P-256'},
    false,
    ['sign'],
  );
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

// ── Apple App Store Server API ──────────────────────────────────────────
// 인증용 JWT(ES256) 생성 — apple-auth 함수의 client secret 생성 로직과 동일한 방식
async function generateAppleServerApiToken(): Promise<string> {
  const keyId = Deno.env.get('APPLE_IAP_KEY_ID')!;
  const issuerId = Deno.env.get('APPLE_IAP_ISSUER_ID')!;
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID')!;
  const privateKeyPem = Deno.env.get('APPLE_IAP_PRIVATE_KEY')!;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({alg: 'ES256', kid: keyId, typ: 'JWT'}));
  const payload = base64url(
    JSON.stringify({
      iss: issuerId,
      iat: now,
      exp: now + 60 * 5, // App Store Server API 토큰은 최대 60분, 넉넉히 5분만 사용
      aud: 'appstoreconnect-v1',
      bid: bundleId,
    }),
  );

  const message = `${header}.${payload}`;
  const privateKey = await importEcPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    {name: 'ECDSA', hash: 'SHA-256'},
    privateKey,
    new TextEncoder().encode(message),
  );
  return `${message}.${base64url(new Uint8Array(signature))}`;
}

interface AppleTransactionInfo {
  transactionId: string;
  productId: string;
  purchaseDate: number; // epoch ms
  revocationDate?: number;
}

// App Store Server API로 거래 정보 조회. signedTransactionInfo는 JWS라서 payload만
// 디코드해서 씀(서명 검증은 Apple 공개키 체인 확인까지 필요해서 TODO로 남김 — MVP에서는
// HTTPS로 Apple 서버에 직접 묻는 것 자체가 1차 신뢰 근거가 됨)
async function verifyAppStoreTransaction(transactionId: string): Promise<AppleTransactionInfo> {
  const token = await generateAppleServerApiToken();
  // 운영 전환 시 sandbox 호스트(api.storekit-sandbox.itunes.apple.com)도 같이 확인해야 할 수 있음
  const res = await fetch(
    `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${transactionId}`,
    {headers: {Authorization: `Bearer ${token}`}},
  );
  if (!res.ok) {
    throw new Error(`Apple transaction lookup failed: ${res.status} ${await res.text()}`);
  }
  const {signedTransactionInfo} = await res.json();
  const [, payloadSegment] = signedTransactionInfo.split('.');
  return base64urlDecodeToJson(payloadSegment) as AppleTransactionInfo;
}

// ── Google Play Developer API ───────────────────────────────────────────
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

interface GooglePurchaseInfo {
  purchaseState: number; // 0 = purchased, 1 = canceled
  purchaseTimeMillis: string;
}

async function verifyGooglePurchase(
  productId: string,
  purchaseToken: string,
): Promise<GooglePurchaseInfo> {
  const packageName = Deno.env.get('GOOGLE_PACKAGE_NAME')!;
  const accessToken = await getGoogleAccessToken();
  const res = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`,
    {headers: {Authorization: `Bearer ${accessToken}`}},
  );
  if (!res.ok) {
    throw new Error(`Google purchase lookup failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    // 1) 호출자 인증 — 바디의 값을 믿지 않고 JWT에서 유저 ID를 직접 뽑음
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({error: 'Unauthorized'}), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {global: {headers: {Authorization: authHeader}}},
    );
    const {
      data: {user},
      error: authError,
    } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({error: 'Unauthorized'}), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body: VerifyRequestBody = await req.json();
    if (body.productId !== SUPPORT_PRODUCT_ID) {
      return new Response(JSON.stringify({error: 'Unknown product'}), {
        status: 400,
        headers: corsHeaders,
      });
    }

    let purchasedAt: Date;
    let storePayload: Record<string, unknown>;

    if (body.store === 'app_store') {
      const info = await verifyAppStoreTransaction(body.transactionId);
      if (info.productId !== SUPPORT_PRODUCT_ID) {
        throw new Error(`Apple productId mismatch: ${info.productId}`);
      }
      if (info.revocationDate) {
        throw new Error('이미 환불된 거래예요.');
      }
      purchasedAt = new Date(info.purchaseDate);
      storePayload = info as unknown as Record<string, unknown>;
    } else if (body.store === 'google_play') {
      const info = await verifyGooglePurchase(SUPPORT_PRODUCT_ID, body.transactionId);
      if (info.purchaseState !== 0) {
        throw new Error(`Google purchase not in purchased state: ${info.purchaseState}`);
      }
      purchasedAt = new Date(Number(info.purchaseTimeMillis));
      storePayload = info as unknown as Record<string, unknown>;
    } else {
      return new Response(JSON.stringify({error: 'Unknown store'}), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 2) service_role로 기록 — supporter_level/count 갱신 트리거가 여기서 자동으로 붙음
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const {error: insertError} = await adminSupabase.from('supporter_purchases').insert({
      user_id: user.id,
      store: body.store,
      product_id: SUPPORT_PRODUCT_ID,
      transaction_id: body.transactionId,
      price_krw: SUPPORT_PRICE_KRW,
      purchased_at: purchasedAt.toISOString(),
      store_payload: storePayload,
    });

    // 같은 거래로 재호출된 경우(네트워크 재시도 등) — 이미 처리된 거래면 에러 대신 성공 취급
    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }

    const {data: userRow} = await adminSupabase
      .from('users')
      .select('supporter_level, supporter_count')
      .eq('id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        supporter_level: userRow?.supporter_level ?? null,
        supporter_count: userRow?.supporter_count ?? 0,
      }),
      {headers: {...corsHeaders, 'Content-Type': 'application/json'}},
    );
  } catch (error) {
    console.error('verify-supporter-purchase error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
