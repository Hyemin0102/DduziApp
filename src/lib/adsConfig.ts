import {supabase} from '@/lib/supabase';

let cachedResult: Promise<boolean> | null = null;

// 조회 실패 시에는 광고를 끄지 않고 그대로 노출 (fail-open) — 네트워크 문제로
// 갑자기 전체 광고 매출이 끊기는 것을 방지
const loadAdsEnabled = async (): Promise<boolean> => {
  try {
    const {data, error} = await supabase
      .from('app_ads_config')
      .select('ads_enabled')
      .eq('key', 'global')
      .maybeSingle();
    return error || !data ? true : data.ads_enabled;
  } catch {
    return true;
  }
};

// 앱 실행 중 한 번만 조회해서 재사용 — 화면마다 여러 광고 컴포넌트가 동시에
// 마운트돼도 DB를 반복 조회하지 않도록 캐싱
export function fetchAdsEnabled(): Promise<boolean> {
  if (!cachedResult) {
    cachedResult = loadAdsEnabled();
  }
  return cachedResult;
}
