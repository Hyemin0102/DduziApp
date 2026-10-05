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

    const {id} = await req.json().catch(() => ({}));
    if (!id) {
      return new Response(JSON.stringify({error: 'id required'}), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const url = `${RAVELRY_BASE_URL}/patterns/${id}.json`;
    console.log(`[ravelry-pattern-detail] GET ${url}`);

    const basicAuth = btoa(`${RAVELRY_USERNAME}:${RAVELRY_PASSWORD}`);
    const ravelryRes = await fetch(url, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'User-Agent': 'Dduzi/1.0 (com.dduzi.app)',
      },
    });

    const body = await ravelryRes.text();
    console.log(`[ravelry-pattern-detail] ${ravelryRes.status} <- ${url}`);

    if (!ravelryRes.ok) {
      console.error(`[ravelry-pattern-detail] error body: ${body}`);
      return new Response(
        JSON.stringify({error: 'Ravelry API error', status: ravelryRes.status, body}),
        {status: ravelryRes.status, headers: {...corsHeaders, 'Content-Type': 'application/json'}},
      );
    }

    return new Response(body, {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('[ravelry-pattern-detail] unexpected error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
