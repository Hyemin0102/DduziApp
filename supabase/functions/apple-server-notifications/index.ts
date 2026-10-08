// Apple App Store Server Notifications V2 수신용 웹훅.
// App Store Connect > 앱 정보 > App Store Server Notifications에 이 함수 URL을 등록해두면,
// 환불(REFUND) 등 이벤트가 발생할 때마다 Apple이 이 엔드포인트로 알려줌.
//
// 필요한 환경변수(Secrets): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// 주의(TODO): Apple이 보내는 payload는 JWS(서명된 JSON)라서, 여기서는 서명 검증 없이
// payload만 디코드해서 씀. 실제 운영 전에는 JWS 헤더의 x5c 인증서 체인을 Apple 루트
// 인증서까지 검증하는 로직을 추가해야 위조된 요청을 막을 수 있음(지금은 구조만 잡아둔 상태).

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function base64urlDecodeToJson(segment: string): any {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
  return JSON.parse(json);
}

function decodeJws(jws: string): any {
  const [, payloadSegment] = jws.split('.');
  return base64urlDecodeToJson(payloadSegment);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {signedPayload} = await req.json();
    const notification = decodeJws(signedPayload);
    const notificationType = notification.notificationType as string;

    // 관심 있는 이벤트만 처리 — 그 외(갱신, 체험판 등은 응원 상품과 무관)는 무시
    if (notificationType === 'REFUND') {
      const transactionInfo = decodeJws(notification.data.signedTransactionInfo);
      const transactionId = transactionInfo.transactionId as string;
      const revokedAtMs = transactionInfo.revocationDate as number | undefined;

      const adminSupabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const {error} = await adminSupabase
        .from('supporter_purchases')
        .update({
          status: 'refunded',
          refunded_at: new Date(revokedAtMs ?? Date.now()).toISOString(),
        })
        .eq('store', 'app_store')
        .eq('transaction_id', transactionId)
        .eq('status', 'active');
      if (error) throw error;
    }

    // Apple은 200이 바로 안 오면 재시도하므로, 모르는 이벤트 타입도 일단 200으로 응답
    return new Response(JSON.stringify({received: true}), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('apple-server-notifications error:', error);
    // 형식이 이상해도 Apple의 무한 재시도를 막기 위해 200으로 응답하고 로그만 남김
    return new Response(JSON.stringify({received: true, error: String(error)}), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
