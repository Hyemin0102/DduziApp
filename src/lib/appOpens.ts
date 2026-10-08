import DeviceInfo from 'react-native-device-info';
import {supabase} from './supabase';

// 하루 1회(KST 기준, DB의 opened_on 기본값)만 기록되도록 유니크 제약에 기대어
// ON CONFLICT DO NOTHING으로 처리 — 중복 호출돼도 안전함
export async function recordAppOpen(userId: string) {
  try {
    const {error} = await supabase.from('app_opens').upsert(
      {user_id: userId, app_version: DeviceInfo.getVersion()},
      {onConflict: 'user_id,opened_on', ignoreDuplicates: true},
    );
    if (error) throw error;
  } catch (error) {
    console.error('❌ 접속 기록 실패:', error);
  }
}
