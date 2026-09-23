import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const RAVELRY_BASE_URL = 'https://api.ravelry.com';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    // JWT 검증 — 로그인한 앱 사용자만 이 프록시를 통해 Ravelry API를 호출할 수 있게 제한
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

    const RAVELRY_USERNAME = Deno.env.get('RAVELRY_USERNAME');
    const RAVELRY_PASSWORD = Deno.env.get('RAVELRY_PASSWORD');
    if (!RAVELRY_USERNAME || !RAVELRY_PASSWORD) {
      throw new Error('RAVELRY_USERNAME/RAVELRY_PASSWORD not set');
    }

    const {query = '', page = 1} = await req.json().catch(() => ({}));

    const url = new URL(`${RAVELRY_BASE_URL}/patterns/search.json`);
    if (query) url.searchParams.set('query', query);
    url.searchParams.set('page', String(page));

    const basicAuth = btoa(`${RAVELRY_USERNAME}:${RAVELRY_PASSWORD}`);
    const ravelryRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        // Ravelry가 요청을 보낸 앱을 식별하는 데 필요 (없으면 자격증명이 맞아도
        // "application was not authorized" 403이 날 수 있음)
        'User-Agent': 'Dduzi/1.0 (com.dduzi.app)',
      },
    });

    const body = await ravelryRes.text();
    if (!ravelryRes.ok) {
      console.error('Ravelry API error:', ravelryRes.status, body);
      return new Response(
        JSON.stringify({
          error: 'Ravelry API error',
          status: ravelryRes.status,
          body,
          // 비밀번호는 노출하지 않고, username 값이 Secret에 제대로 들어갔는지만
          // 확인할 수 있게 앞 6자/길이만 같이 반환 (Ravelry 대시보드 값과 비교용)
          debugUsernamePreview: `${RAVELRY_USERNAME.slice(0, 6)}...(len ${RAVELRY_USERNAME.length})`,
          debugPasswordLength: RAVELRY_PASSWORD.length,
        }),
        {status: ravelryRes.status, headers: {...corsHeaders, 'Content-Type': 'application/json'}},
      );
    }

    return new Response(body, {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('ravelry-search error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
