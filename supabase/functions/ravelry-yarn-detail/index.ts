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

    const {ids} = await req.json().catch(() => ({}));
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({error: 'ids required'}), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const basicAuth = btoa(`${RAVELRY_USERNAME}:${RAVELRY_PASSWORD}`);
    const headers = {
      Authorization: `Basic ${basicAuth}`,
      'User-Agent': 'Dduzi/1.0 (com.dduzi.app)',
    };

    // 화면에는 소수만 보여줄 거라(최대 3개) 개별 조회를 병렬로 처리
    const results = await Promise.allSettled(
      ids.map(async (id: number) => {
        const url = `${RAVELRY_BASE_URL}/yarns/${id}.json`;
        console.log(`[ravelry-yarn-detail] GET ${url}`);
        const res = await fetch(url, {headers});
        console.log(`[ravelry-yarn-detail] ${res.status} <- ${url}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        return data.yarn;
      }),
    );

    const yarns = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    return new Response(JSON.stringify({yarns}), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('[ravelry-yarn-detail] unexpected error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
