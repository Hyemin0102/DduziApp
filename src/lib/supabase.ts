import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const localSupabaseUrl = 'http://172.30.1.77:54321' // CLI 기본 URL
const localSupabaseAnonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const prodSupabaseUrl = 'https://aaeqoryqxtkcovplmpyx.supabase.co' // Kakao 설정된 프로젝트
const prodSupabaseAnonKey = 'sb_publishable_y99DR55KcQ_qNT6WgJDZeg_MaN-VvdI'

//DB작업(일반 사용자 권한)
export const supabaseLocalDB = createClient(localSupabaseUrl, localSupabaseAnonKey, {
  auth: {
    persistSession: false, 
  }
})

//Auth 작업(프로덕션)
export const supabaseAuth = createClient(prodSupabaseUrl, prodSupabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})


