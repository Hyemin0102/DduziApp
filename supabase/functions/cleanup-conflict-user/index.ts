import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  try {
    const { userId, conflictProvider } = await req.json()

    if (!userId || !conflictProvider) {
      return new Response(
        JSON.stringify({ error: 'userId와 conflictProvider는 필수입니다.' }),
        { status: 400 },
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 해당 유저의 identities 조회
    const { data: identities, error: fetchError } = await supabaseAdmin
      .from('identities')
      .select('*')
      .eq('user_id', userId)
      .schema('auth')

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500 },
      )
    }

    // conflictProvider 외에 다른 identity가 있으면 기존 계정이 존재하는 것
    const hasExistingProvider = identities?.some(
      i => i.provider !== conflictProvider,
    )

    if (hasExistingProvider) {
      // 기존 계정 보호 - 방금 추가된 conflict provider identity만 제거
      const { error: deleteError } = await supabaseAdmin
        .from('identities')
        .delete()
        .eq('user_id', userId)
        .eq('provider', conflictProvider)
        .schema('auth')

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500 },
        )
      }

      return new Response(
        JSON.stringify({ action: 'unlinked', provider: conflictProvider }),
        { status: 200 },
      )
    }

    // 기존 계정이 없는 완전 신규 유저면 auth.users 자체 삭제
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      return new Response(
        JSON.stringify({ error: deleteUserError.message }),
        { status: 500 },
      )
    }

    return new Response(
      JSON.stringify({ action: 'deleted', userId }),
      { status: 200 },
    )
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || '알 수 없는 오류가 발생했습니다.' }),
      { status: 500 },
    )
  }
})