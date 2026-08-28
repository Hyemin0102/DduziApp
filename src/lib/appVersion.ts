import {Platform} from 'react-native';
import {supabase} from '@/lib/supabase';

export interface AppVersionConfig {
  latest_version: string;
  min_supported_version: string;
  show_update_modal: boolean;
  release_notes: string | null;
}

// "1.0.3" 같은 점 구분 버전 문자열 비교. a < b면 음수, 같으면 0, a > b면 양수
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function fetchAppVersionConfig(): Promise<AppVersionConfig | null> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const {data, error} = await supabase
    .from('app_version_config')
    .select('latest_version, min_supported_version, show_update_modal, release_notes')
    .eq('platform', platform)
    .maybeSingle();

  if (error || !data) return null;
  return data as AppVersionConfig;
}

export const STORE_URLS = {
  ios: (appStoreId: string) =>
    `itms-apps://itunes.apple.com/app/id${appStoreId}`,
  android: (bundleId: string) => `market://details?id=${bundleId}`,
  androidWeb: (bundleId: string) =>
    `https://play.google.com/store/apps/details?id=${bundleId}`,
};

const BUNDLE_ID = 'com.dduzi.app';

export async function fetchIosAppStoreId(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${BUNDLE_ID}&country=kr`,
    );
    const json = await res.json();
    if (json.resultCount > 0) return String(json.results[0].trackId);
    return null;
  } catch {
    return null;
  }
}
