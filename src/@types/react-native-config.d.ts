declare module 'react-native-config' {
  export interface NativeConfig {
    APP_NAME: string;
    KAKAO_SDK: string;
    NAVER_SCHEME: string;
    GOOGLE_WEB_CLIENT_ID: string;
    GOOGLE_IOS_CLIENT_ID: string;
    NAVER_CLIENT_ID: string;
    NAVER_CLIENT_SECRET: string;
    RN_SUPABASE_URL: string;
    
  }

  export const Config: Partial<NativeConfig>;
  export default Config;
}
