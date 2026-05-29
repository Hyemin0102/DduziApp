// @deno-types="npm:@supabase/supabase-js@2"
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {user_id, content} = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const {data: userData} = await supabase
      .from('users')
      .select('nickname, email, profile_image')
      .eq('id', user_id)
      .single();

    const nickname = userData?.nickname ?? '(닉네임 없음)';
    const email = userData?.email ?? '(이메일 없음)';
    const submittedAt = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});

    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const toEmail = Deno.env.get('NOTIFY_EMAIL')!;

    const emailBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #191919;">📬 새 문의가 도착했습니다</h2>
        <hr style="border: 1px solid #eee;" />

        <h3 style="color: #555;">👤 사용자 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 12px; color: #888; width: 100px;">닉네임</td>
            <td style="padding: 6px 12px; color: #191919;">${nickname}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 6px 12px; color: #888;">이메일</td>
            <td style="padding: 6px 12px; color: #191919;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; color: #888;">User ID</td>
            <td style="padding: 6px 12px; color: #191919; font-size: 12px;">${user_id}</td>
          </tr>
        </table>

        <h3 style="color: #555; margin-top: 24px;">💬 문의 내용</h3>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; border-left: 4px solid #191919; white-space: pre-wrap; color: #191919;">
${content}
        </div>

        <p style="color: #bbb; font-size: 12px; margin-top: 24px;">접수 시각: ${submittedAt}</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Dduzi <onboarding@resend.dev>',
        to: [toEmail],
        subject: `[뜨지] 새 문의: ${nickname}`,
        html: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ok: true}), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (e) {
    return new Response(JSON.stringify({error: String(e)}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
