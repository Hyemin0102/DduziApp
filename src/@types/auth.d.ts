// 라이브러리에서 제공하는 타입 재사용
import type { KakaoProfile } from '@react-native-seoul/kakao-login';
import type { User as GoogleUser } from '@react-native-google-signin/google-signin';

export type KakaoUserProfile = KakaoProfile;

export type GoogleUserProfile = GoogleUser['user'];

export interface NaverUserProfile {
  id: string;
  nickname?: string | null;
  name?: string;
  email?: string;
  gender?: string | null;
  age?: string | null;
  birthday?: string | null;
  profile_image?: string | null;
  birthyear?: number | null;
  mobile?: string | null;
  mobile_e164?: string | null;
}

// 통합 사용자 프로필 (공통 필드)
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  provider: string;
  profileImage?: string;
  nickname?: string;
  bio? :string;

  // 원본 프로필 데이터 보관 (provider별로 다름)
  rawProfile: KakaoUserProfile | NaverUserProfile | GoogleUserProfile;
}

// Auth Context 타입
export interface AuthContextType {
  //로그인 여부
  isLoggedIn: boolean;
  //유저 정보
  user: UserProfile | null;
  isLoading: boolean;
  //가입 경로
  provider: string;
  //신규 유저 확인
  needsProfileSetup: boolean;
  login: (
    token: string,
    userData: UserProfile,
    provider: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  //supabase Auth 세션 확인
  checkAuthStatus: () => Promise<void>;
  //로컬 유저 프로필 업데이트
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  //프로필 업데이트 상태 관리
  setNeedsProfileSetup: (needs: boolean) => void;
}

// Auth Provider Props
export interface AuthProviderProps {
  children: React.ReactNode;
}
