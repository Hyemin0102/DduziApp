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

    const {reporterId, reporterNickname, postId, postContent, reason} =
      await req.json();

    // 토큰의 uid와 요청의 reporterId가 일치하는지 확인
    if (user.id !== reporterId) {
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

    const safeNickname = escapeHtml(reporterNickname ?? '');
    const safePostId = escapeHtml(postId ?? '');
    const safeReason = escapeHtml(reason ?? '');
    const safeContent = escapeHtml(postContent ?? '(내용 없음)');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: TO_EMAIL,
        subject: '[뜨지] 게시물 신고가 접수되었습니다',
        html: `
          <h2>게시물 신고 접수</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px">
            <tr>
              <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;font-weight:bold">신고자</td>
              <td style="padding:8px;border:1px solid #eee">${safeNickname} (${user.id})</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;font-weight:bold">게시물 ID</td>
              <td style="padding:8px;border:1px solid #eee">${safePostId}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;font-weight:bold">신고 사유</td>
              <td style="padding:8px;border:1px solid #eee">${safeReason}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;font-weight:bold">게시물 내용</td>
              <td style="padding:8px;border:1px solid #eee">${safeContent}</td>
            </tr>
          </table>
          <p style="margin-top:16px;color:#888;font-size:13px">24시간 내에 검토 후 처리해주세요.</p>
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
    console.error('send-report-email error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
