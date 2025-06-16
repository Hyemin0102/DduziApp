declare module 'react-native-config' {
  export interface NativeConfig {
    APP_NAME: string;
    KAKAO_SDK: string;
    NAVER_SCHEME: string;
    GOOGLE_CLIENT_ID: string;
    NAVER_CLIENT_ID: string;
    NAVER_CLIENT_SECRET: string;
  }

  export const Config: Partial<NativeConfig>;
  export default Config;
}
