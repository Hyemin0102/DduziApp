import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const prodSupabaseUrl = 'https://xjqrqnlhejslenaagnel.supabase.co'; // dduzi_prod (Seoul)
const prodSupabaseAnonKey = 'sb_publishable_6QKvRV65xfR5oKmqVx4T5A_J2gogaQ9';


//Auth 작업(프로덕션)
export const supabase = createClient(prodSupabaseUrl, prodSupabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
