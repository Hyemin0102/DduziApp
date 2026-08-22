import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    // JWT 검증
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
    const {data: {user}, error: authError} = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({error: 'Unauthorized'}), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const {blockerId, blockerNickname, blockedId, blockedNickname} =
      await req.json();

    // 토큰의 uid와 요청의 blockerId가 일치하는지 확인
    if (user.id !== blockerId) {
      return new Response(JSON.stringify({error: 'Forbidden'}), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const TO_EMAIL = Deno.env.get('REPORT_TO_EMAIL') ?? 'gkdlt7373@gmail.com';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not set');
    }

    const safeBlockerNickname = escapeHtml(blockerNickname ?? '');
    const safeBlockedNickname = escapeHtml(blockedNickname ?? '');
    const safeBlockedId = escapeHtml(blockedId ?? '');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: TO_EMAIL,
        subject: '[뜨지] 유저 차단이 발생했습니다',
        html: `
          <h2>유저 차단 알림</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px">
            <tr>
              <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;font-weight:bold">차단한 유저</td>
              <td style="padding:8px;border:1px solid #eee">${safeBlockerNickname} (${user.id})</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;font-weight:bold">차단된 유저</td>
              <td style="padding:8px;border:1px solid #eee">${safeBlockedNickname} (${safeBlockedId})</td>
            </tr>
          </table>
          <p style="margin-top:16px;color:#888;font-size:13px">필요시 24시간 내에 해당 유저의 콘텐츠를 검토해주세요.</p>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Resend error: ${error}`);
    }

    return new Response(JSON.stringify({success: true}), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('send-block-email error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
