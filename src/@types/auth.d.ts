

// 카카오 사용자 프로필 (실제 SDK 응답 형식)
export interface KakaoUserProfile {
  id: number;
  nickname?: string | null;
  profileImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
  email?: string | null;
  name?: string | null;
  ageRange?: string | null;
  birthday?: string | null;
  birthyear?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  isEmailValid?: boolean | null;
  isEmailVerified?: boolean | null;
  isKorean?: boolean | null;
  birthdayType?: string | null;
  // Needs agreement fields
  profileNeedsAgreement?: boolean | null;
  emailNeedsAgreement?: boolean | null;
  ageRangeNeedsAgreement?: boolean | null;
  birthdayNeedsAgreement?: boolean | null;
  birthyearNeedsAgreement?: boolean | null;
  genderNeedsAgreement?: boolean | null;
  phoneNumberNeedsAgreement?: boolean | null;
  isKoreanNeedsAgreement?: boolean | null;
  picture?: string | null;
}

// 네이버 사용자 프로필
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

// 구글 사용자 프로필
export interface GoogleUserProfile {
  id: string;
  name?: string;
  email?: string;
  photo?: string;
  familyName?: string;
  givenName?: string;
}

// 통합 사용자 프로필 (공통 필드)
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  provider: string;
  profileImage?: string;
  nickname?: string;
  defaultImageId?:number;
  bio? :string;

  // 원본 프로필 데이터 보관 (provider별로 다름)
  rawProfile: KakaoUserProfile | NaverUserProfile | GoogleUserProfile;
}

// Auth Context 타입
export interface AuthContextType {
  isLoggedIn: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  provider: string;
  login: (
    token: string,
    userData: UserProfile,
    provider: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// Auth Provider Props
export interface AuthProviderProps {
  children: React.ReactNode;
}
