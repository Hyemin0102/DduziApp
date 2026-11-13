import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const RAVELRY_BASE_URL = 'https://api.ravelry.com';

// 서랍장 > 실 > "레이블리에서 가져오기"에서 쓰는 실 검색 프록시 (GET /yarns/search.json)
// 응답은 가공 없이 그대로 돌려줌 — 화면 설계 전에 어떤 필드가 오는지 클라이언트 로그로 확인하기 위함
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

    const {
      query = '',
      page = 1,
      page_size = 20,
      sort, // best | rating | projects
    } = await req.json().catch(() => ({}));

    const url = new URL(`${RAVELRY_BASE_URL}/yarns/search.json`);
    if (query) url.searchParams.set('query', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(page_size));
    if (sort) url.searchParams.set('sort', sort);

    console.log(`[ravelry-yarn-search] GET ${url.toString()}`);

    const basicAuth = btoa(`${RAVELRY_USERNAME}:${RAVELRY_PASSWORD}`);
    const ravelryRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'User-Agent': 'Dduzi/1.0 (com.dduzi.app)',
      },
    });

    const body = await ravelryRes.text();
    console.log(`[ravelry-yarn-search] ${ravelryRes.status} <- ${url.toString()}`);

    if (!ravelryRes.ok) {
      console.error(`[ravelry-yarn-search] error body: ${body}`);
      return new Response(
        JSON.stringify({error: 'Ravelry API error', status: ravelryRes.status, body}),
        {status: ravelryRes.status, headers: {...corsHeaders, 'Content-Type': 'application/json'}},
      );
    }

    return new Response(body, {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('[ravelry-yarn-search] unexpected error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
