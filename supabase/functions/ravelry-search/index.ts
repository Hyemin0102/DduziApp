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

    const {
      query = '',
      page = 1,
      page_size = 20,
      sort,
      pc,
      craft,
      availability,
      language,
    } = await req.json().catch(() => ({}));

    const url = new URL(`${RAVELRY_BASE_URL}/patterns/search.json`);
    if (query) url.searchParams.set('query', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(page_size));
    if (sort) url.searchParams.set('sort', sort);
    if (pc) url.searchParams.set('pc', pc);
    if (craft) url.searchParams.set('craft', craft);
    if (availability) url.searchParams.set('availability', availability);
    if (language) url.searchParams.set('language', language);

    console.log(`[ravelry-search] GET ${url.toString()}`);

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
    console.log(`[ravelry-search] ${ravelryRes.status} <- ${url.toString()}`);

    if (!ravelryRes.ok) {
      console.error(`[ravelry-search] error body: ${body}`);
      return new Response(
        JSON.stringify({error: 'Ravelry API error', status: ravelryRes.status, body}),
        {status: ravelryRes.status, headers: {...corsHeaders, 'Content-Type': 'application/json'}},
      );
    }

    const searchData = JSON.parse(body);

    // 검색 결과엔 downloadable 여부가 안 들어있어서, 다운로드/구매 경로가 없는
    // (downloadable=false) 도안을 걸러내기 위해 배치 상세 조회를 한 번 더 함.
    // 이 조회가 실패해도 검색 자체는 실패시키지 않고 필터링만 생략함(fail open)
    const ids = (searchData.patterns ?? []).map((p: any) => p.id).filter(Boolean);
    if (ids.length > 0) {
      try {
        const detailUrl = new URL(`${RAVELRY_BASE_URL}/patterns.json`);
        detailUrl.searchParams.set('ids', ids.join(' '));
        console.log(`[ravelry-search] GET ${detailUrl.toString()}`);

        const detailRes = await fetch(detailUrl.toString(), {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'User-Agent': 'Dduzi/1.0 (com.dduzi.app)',
          },
        });
        console.log(`[ravelry-search] ${detailRes.status} <- ${detailUrl.toString()}`);

        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const patternsById = detailData.patterns ?? {};
          searchData.patterns = searchData.patterns.filter(
            (p: any) => patternsById[p.id]?.downloadable !== false,
          );
        }
      } catch (detailError) {
        console.error('[ravelry-search] downloadable 필터링용 상세 조회 실패:', detailError);
      }
    }

    return new Response(JSON.stringify(searchData), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('[ravelry-search] unexpected error:', error);
    return new Response(JSON.stringify({error: String(error)}), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
