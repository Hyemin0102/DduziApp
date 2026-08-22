declare module 'react-native-config' {
  export interface NativeConfig {
    APP_NAME: string;
    KAKAO_SDK: string;
    GOOGLE_WEB_CLIENT_ID: string;
    GOOGLE_IOS_CLIENT_ID: string;
    RN_SUPABASE_URL: string;
    RN_SUPABASE_ANON_KEY: string;

  }

  export const Config: Partial<NativeConfig>;
  export default Config;
}
