import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 프로젝트 제목에서 "지금 많이 뜨고 있어요" 태그 상위 5개를 뽑는 배치 함수.
// pg_cron이 하루 1회 호출 (Authorization: Bearer <service_role_key>).
//
// 규칙 1) 정확 일치: 공백/기호/이모지만 다른 제목은 같은 작품으로 취급
//   예) "프롬후드 가디건" / "프롬 후드 가디건" / "프롬후드가디건" → 전부 동일
// 규칙 2) 접두어 클러스터링: 정규화된 제목끼리 앞부분 4글자 이상이 겹치면 같은 그룹으로 묶고,
//   겹치는 접두어를 키워드로 사용
//   예) "스파이더맨" / "스파이더맨인형" / "스파이더맨키링" → "스파이더맨"
//   (3글자로는 "스파이더맨"과 무관한 "스파이 패밀리" 같은 제목까지 "스파이"로 묶여버림)

const MIN_PREFIX_LEN = 4
const TOP_N = 5

function isStrippedChar(ch: string): boolean {
  return (
    /\s/.test(ch) ||
    /\p{P}/u.test(ch) ||
    /\p{S}/u.test(ch) ||
    /\p{Extended_Pictographic}/u.test(ch)
  )
}

function normalizeTitle(title: string): string {
  let result = ''
  for (const ch of title.normalize('NFC')) {
    if (!isStrippedChar(ch)) result += ch
  }
  return result.toLowerCase()
}

// original 문자열에서, 정규화했을 때 길이가 targetNormalizedLen이 되는 지점까지
// 원본 표기(공백 포함) 그대로 잘라서 반환 — 태그에 자연스러운 형태로 보여주기 위함
function extractPrettyPrefix(original: string, targetNormalizedLen: number): string {
  let normalizedCount = 0
  const chars = Array.from(original.normalize('NFC'))
  for (let i = 0; i < chars.length; i++) {
    if (!isStrippedChar(chars[i])) {
      normalizedCount++
      if (normalizedCount === targetNormalizedLen) {
        // 자르는 지점 바로 뒤에 붙는 기호(닫는 괄호 등)는 정규화 시 무시돼서 글자 수에
        // 안 잡히지만, 시각적으로는 접두어에 속하는 게 자연스러우므로 함께 포함
        let end = i + 1
        while (end < chars.length && isStrippedChar(chars[end])) {
          end++
        }
        return chars.slice(0, end).join('').trim()
      }
    }
  }
  return original.trim()
}

function commonPrefixLength(a: string, b: string): number {
  const len = Math.min(a.length, b.length)
  let i = 0
  while (i < len && a[i] === b[i]) i++
  return i
}

interface ExactGroup {
  normalized: string
  count: number
  label: string
  titles: string[]
}

interface Cluster {
  lcp: string
  count: number
  members: ExactGroup[]
}

export function computeTrendingKeywords(
  titles: string[],
): {keyword: string; count: number; titles: string[]}[] {
  // 1) 정규화 후 정확 일치 그룹핑
  const groups = new Map<string, {count: number; labelCounts: Map<string, number>}>()
  for (const raw of titles) {
    const trimmed = raw?.trim()
    if (!trimmed) continue
    const normalized = normalizeTitle(trimmed)
    if (!normalized) continue
    const g = groups.get(normalized) ?? {count: 0, labelCounts: new Map()}
    g.count++
    g.labelCounts.set(trimmed, (g.labelCounts.get(trimmed) ?? 0) + 1)
    groups.set(normalized, g)
  }

  const exactGroups: ExactGroup[] = Array.from(groups.entries())
    .map(([normalized, g]) => {
      let label = normalized
      let max = 0
      for (const [l, c] of g.labelCounts) {
        if (c > max) {
          max = c
          label = l
        }
      }
      return {normalized, count: g.count, label, titles: Array.from(g.labelCounts.keys())}
    })
    .sort((a, b) => (a.normalized < b.normalized ? -1 : a.normalized > b.normalized ? 1 : 0))

  // 2) 정렬된 순서로 스캔하며 공통 접두어 3글자 이상인 그룹끼리 묶기
  const clusters: Cluster[] = []
  for (const group of exactGroups) {
    const current = clusters[clusters.length - 1]
    if (current) {
      const cp = commonPrefixLength(current.lcp, group.normalized)
      if (cp >= MIN_PREFIX_LEN) {
        current.lcp = current.lcp.slice(0, cp)
        current.count += group.count
        current.members.push(group)
        continue
      }
    }
    clusters.push({lcp: group.normalized, count: group.count, members: [group]})
  }

  // 3) 대표 키워드 라벨 결정 (서비스 초기엔 데이터가 적어 최소 등장 횟수 필터를 두지 않음)
  return clusters
    .map(c => {
      const titles = c.members.flatMap(m => m.titles)
      if (c.members.length === 1) {
        return {keyword: c.members[0].label, count: c.count, titles}
      }
      const representative = c.members[0].label
      const keyword = extractPrettyPrefix(representative, c.lcp.length)
      return {keyword, count: c.count, titles}
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)
}

Deno.serve(async req => {
  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401})
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey)

    // 게시물이 하나도 없는 프로젝트는 제외 — search_posts가 posts 기준으로 검색하기 때문에
    // 그런 프로젝트 제목이 트렌드 태그로 뜨면 눌러도 검색 결과가 안 나옴
    const {data, error} = await supabaseAdmin
      .from('projects')
      .select('title, posts!inner(id)')
      .eq('visibility', 'public')

    if (error) throw error

    const titles = (data ?? []).map((p: {title: string}) => p.title)
    const top = computeTrendingKeywords(titles)

    // 관리자 검토 전에는 화면(public.trending_keywords)에 바로 반영되지 않도록,
    // 배치 결과는 pending 테이블에만 씀 — 승인은 관리자가 SQL로 수동 반영
    const {error: deleteError} = await supabaseAdmin
      .from('trending_keywords_pending')
      .delete()
      .gt('rank', 0)
    if (deleteError) throw deleteError

    if (top.length > 0) {
      const rows = top.map((k, i) => ({
        rank: i + 1,
        keyword: k.keyword,
        project_count: k.count,
      }))
      const {error: insertError} = await supabaseAdmin
        .from('trending_keywords_pending')
        .insert(rows)
      if (insertError) throw insertError
    }

    // "뜨개함에 많이 저장됐어요"는 get_most_saved_projects가 SECURITY DEFINER로 바뀌면서
    // 클라이언트가 실시간으로 직접 호출하므로, 이 배치에서 더 이상 캐시할 필요 없음

    return new Response(JSON.stringify({success: true, top}), {status: 200})
  } catch (e: any) {
    return new Response(
      JSON.stringify({error: e?.message || '알 수 없는 오류가 발생했습니다.'}),
      {status: 500},
    )
  }
})
