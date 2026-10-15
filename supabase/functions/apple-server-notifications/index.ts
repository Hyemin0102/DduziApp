// Apple App Store Server Notifications V2 수신용 웹훅.
// App Store Connect > 앱 정보 > App Store Server Notifications에 이 함수 URL을 등록해두면,
// 환불(REFUND) 등 이벤트가 발생할 때마다 Apple이 이 엔드포인트로 알려줌.
//
// 필요한 환경변수(Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   APPLE_BUNDLE_ID    — 앱 번들 ID (verify-supporter-purchase와 동일한 값 재사용, 이미 dev에 설정돼 있음)
//   APPLE_ENVIRONMENT  — "Production" 또는 "Sandbox". 미설정 시 Sandbox로 동작(지금까지의 dev 테스트와
//                        동일한 동작 유지). prod 프로젝트에는 반드시 "Production"으로 설정할 것.
//   APPLE_APP_APPLE_ID — App Store Connect의 앱 고유 숫자 ID(App Information에서 확인). Production
//                        환경 검증에만 필요(Sandbox는 생략 가능, Apple도 Sandbox 페이로드엔 이 값을 안 담음).
//
// Apple이 보내는 payload는 JWS(서명된 JSON)라서, Apple 공식 라이브러리(@apple/app-store-server-library)로
// JWS 서명 + x5c 인증서 체인을 Apple Root CA - G3까지 검증한 뒤에만 payload를 신뢰함. 서명이 위조됐거나,
// 번들 ID/환경이 기대값과 다르면 verifyAndDecodeNotification이 throw하고, 그 즉시 catch로 빠져서
// DB는 전혀 갱신되지 않음(아래 처리 로직까지 도달하지 못함).
//
// enableOnlineChecks(OCSP 실시간 폐기 확인)는 꺼둠: 서명/체인/만료 검증만으로도 위조 요청 차단이라는
// 목적은 충분히 달성되고, 이 함수는 실패 시에도 Apple 재시도를 막기 위해 항상 200을 반환하는 구조라
// OCSP 서버 일시 장애로 정상 환불 이벤트가 조용히 유실되는 리스크를 피하는 쪽을 택함.

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {SignedDataVerifier, Environment} from 'npm:@apple/app-store-server-library@3.1.0';
import {Buffer} from 'node:buffer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Apple Root CA - G3 (https://www.apple.com/certificateauthority/ 에서 받은 공식 루트 인증서, DER→base64).
// 공개 인증서라 시크릿이 아니라 소스에 고정해둠. Apple이 루트를 교체/추가하면 이 값도 같이 갱신해야 함.
const APPLE_ROOT_CA_G3_BASE64 =
  'MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQL' +
  'DB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMw' +
  'MTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRp' +
  'ZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IA' +
  'BJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqX' +
  'l5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8w' +
  'DgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWT' +
  'xnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==';

function buildVerifier(): SignedDataVerifier {
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID')!;
  const environment =
    Deno.env.get('APPLE_ENVIRONMENT') === 'Production'
      ? Environment.PRODUCTION
      : Environment.SANDBOX;

  const appAppleIdRaw = Deno.env.get('APPLE_APP_APPLE_ID');
  const appAppleId = appAppleIdRaw ? Number(appAppleIdRaw) : undefined;
  if (environment === Environment.PRODUCTION && !appAppleId) {
    throw new Error(
      'APPLE_ENVIRONMENT=Production인데 APPLE_APP_APPLE_ID가 설정되지 않았습니다.',
    );
  }

  const rootCert = Buffer.from(APPLE_ROOT_CA_G3_BASE64, 'base64');
  return new SignedDataVerifier([rootCert], false, environment, bundleId, appAppleId);
}

const verifier = buildVerifier();

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {signedPayload} = await req.json();
    const notification = await verifier.verifyAndDecodeNotification(signedPayload);
    const notificationType = notification.notificationType as string;

    // 관심 있는 이벤트만 처리 — 그 외(갱신, 체험판 등은 응원 상품과 무관)는 무시
    if (notificationType === 'REFUND' && notification.data?.signedTransactionInfo) {
      const transactionInfo = await verifier.verifyAndDecodeTransaction(
        notification.data.signedTransactionInfo,
      );
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
    // 서명 검증 실패(위조 요청) 포함, 형식이 이상해도 Apple의 무한 재시도를 막기 위해
    // 200으로 응답하고 로그만 남김 — 검증을 통과 못 한 payload는 위 try 블록에서 바로 throw되므로
    // DB는 절대 갱신되지 않음.
    return new Response(JSON.stringify({received: true, error: String(error)}), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
