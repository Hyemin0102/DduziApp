import {supabase} from './supabase';
import {compareVersions} from './appVersion';
import {
  SUPPORT_FEATURE_MIN_VERSION,
  SUPPORT_MODAL_BASELINE_WAIT_DAYS,
  SUPPORT_MODAL_STAGE2_GAP_DAYS,
  SUPPORT_MODAL_STAGE3_GAP_DAYS,
  SUPPORT_MODAL_MIN_APP_OPENS,
  SUPPORT_MODAL_MIN_POSTS,
  SUPPORT_MODAL_MIN_PROJECTS,
  SUPPORT_MODAL_RETURN_MIN_APP_OPENS,
  SUPPORT_MODAL_RETURN_MIN_POSTS,
  SUPPORT_MODAL_RETURN_MIN_PROJECTS,
} from '@/constants/support.constant';

export type SupportModalStage = 1 | 2 | 3;

const daysSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);

// "기능 버전을 처음 실행한 날" — app_opens 중 SUPPORT_FEATURE_MIN_VERSION 이상인 가장 이른 기록.
// 날짜 문자열 비교가 아니라 버전 숫자 비교로 걸러야 해서 클라이언트에서 처리함
async function getFeatureFirstSeenDate(userId: string): Promise<string | null> {
  const {data, error} = await supabase
    .from('app_opens')
    .select('opened_on, app_version')
    .eq('user_id', userId)
    .order('opened_on', {ascending: true})
    .limit(365);
  if (error || !data) return null;
  const firstValid = data.find(
    row => !!row.app_version && compareVersions(row.app_version, SUPPORT_FEATURE_MIN_VERSION) >= 0,
  );
  return firstValid?.opened_on ?? null;
}

// 다음에 보여줄 모달 단계(1/2/3)를 판단. 보여줄 게 없으면 null
export async function getSupportModalStage(userId: string): Promise<SupportModalStage | null> {
  try {
    const [userRes, lastLogRes] = await Promise.all([
      supabase.from('users').select('created_at, supporter_count').eq('id', userId).single(),
      supabase
        .from('support_modal_logs')
        .select('stage, shown_at')
        .eq('user_id', userId)
        .order('shown_at', {ascending: false})
        .limit(1),
    ]);

    if (userRes.error || !userRes.data) return null;
    // 이미 응원했으면 더 이상 유도하지 않음
    if ((userRes.data.supporter_count ?? 0) > 0) return null;

    const lastLog = lastLogRes.data?.[0] ?? null;

    if (!lastLog) {
      const [opensRes, postsRes, projectsRes, featureFirstSeen] = await Promise.all([
        supabase.from('app_opens').select('user_id', {count: 'exact', head: true}).eq('user_id', userId),
        supabase.from('posts').select('id', {count: 'exact', head: true}).eq('user_id', userId),
        supabase.from('projects').select('id', {count: 'exact', head: true}).eq('user_id', userId),
        getFeatureFirstSeenDate(userId),
      ]);

      // 기준일 = max(가입일, 기능 버전 첫 실행일)
      const signupTime = new Date(userRes.data.created_at).getTime();
      const featureTime = featureFirstSeen ? new Date(featureFirstSeen).getTime() : 0;
      const baselineIso = new Date(Math.max(signupTime, featureTime)).toISOString();
      if (daysSince(baselineIso) < SUPPORT_MODAL_BASELINE_WAIT_DAYS) {
        return null;
      }

      const meetsActivity =
        (opensRes.count ?? 0) >= SUPPORT_MODAL_MIN_APP_OPENS ||
        (postsRes.count ?? 0) >= SUPPORT_MODAL_MIN_POSTS ||
        (projectsRes.count ?? 0) >= SUPPORT_MODAL_MIN_PROJECTS;

      return meetsActivity ? 1 : null;
    }

    if (lastLog.stage >= 3) return null;
    const gapDays =
      lastLog.stage === 1 ? SUPPORT_MODAL_STAGE2_GAP_DAYS : SUPPORT_MODAL_STAGE3_GAP_DAYS;
    if (daysSince(lastLog.shown_at) < gapDays) {
      return null;
    }

    // 날짜만 지났다고 바로 띄우면, 오래 안 쓰다가 어쩌다 한 번 들어온 사람한테도 뜰 수 있어서
    // 마지막 노출 이후 실제 활동이 있었는지도 같이 확인함(1단계보다 완화된 기준)
    const sinceShownAt = lastLog.shown_at;
    const [returnOpensRes, returnPostsRes, returnProjectsRes] = await Promise.all([
      supabase
        .from('app_opens')
        .select('user_id', {count: 'exact', head: true})
        .eq('user_id', userId)
        .gte('opened_on', sinceShownAt),
      supabase
        .from('posts')
        .select('id', {count: 'exact', head: true})
        .eq('user_id', userId)
        .gte('created_at', sinceShownAt),
      supabase
        .from('projects')
        .select('id', {count: 'exact', head: true})
        .eq('user_id', userId)
        .gte('created_at', sinceShownAt),
    ]);

    const meetsReturnActivity =
      (returnOpensRes.count ?? 0) >= SUPPORT_MODAL_RETURN_MIN_APP_OPENS ||
      (returnPostsRes.count ?? 0) >= SUPPORT_MODAL_RETURN_MIN_POSTS ||
      (returnProjectsRes.count ?? 0) >= SUPPORT_MODAL_RETURN_MIN_PROJECTS;
    if (!meetsReturnActivity) return null;

    return (lastLog.stage + 1) as SupportModalStage;
  } catch (error) {
    console.error('❌ 응원 모달 조건 확인 실패:', error);
    return null;
  }
}

export async function recordSupportModalShown(userId: string, stage: SupportModalStage) {
  try {
    const {error} = await supabase
      .from('support_modal_logs')
      .insert({user_id: userId, stage});
    if (error) throw error;
  } catch (error) {
    console.error('❌ 응원 모달 노출 기록 실패:', error);
  }
}
