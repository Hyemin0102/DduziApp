// ================================
// 기본 테이블 타입
// ================================

export interface User {
  id: string;
  nickname: string;
  profile_image: string | null;
  bio: string | null;
  created_at: string;
}

export interface PostImage {
  id: string;
  post_id?: string;
  image_url: string;
  display_order: number;
  created_at?: string;
}

export interface KnittingLog {
  id: string;
  post_id?: string;
  content: string;
  created_at: string;
}

// ================================
// 게시물 기본 타입 (DB 테이블 구조)
// ================================

export interface PostBase {
  id: string;
  user_id: string;
  title: string;
  content: string;
  yarn_info?: string;
  pattern_info?: string;
  pattern_url?: string | null;
  needle_info?: string;
  created_at: string;
  updated_at: string;
  is_completed: boolean;
  visibility: 'public' | 'private';
}

// ================================
// 조회용 타입
// ================================

// 홈/검색용 (users, post_images 조인)
export interface Post extends PostBase {
  users: {
    id: string;
    nickname: string;
    profile_image: string;
  };
  post_images: Array<Pick<PostImage, 'id' | 'image_url' | 'display_order'>>;
}

// 프로젝트 페이지용 (간소화)
export type PostItem = Pick<
  Post,
  'id' | 'title' | 'created_at' | 'updated_at' | 'post_images' | 'is_completed' | 'visibility'
>;

// 상세 페이지용 (플랫 구조 + knitting_logs)
export interface PostDetail extends PostBase {
  nickname: string;
  profile_image: string | null;
  images: PostImage[];
  knitting_logs: KnittingLog[];
}

// ================================
// 입력용 타입
// ================================

// 게시물 입력 공통 필드
interface PostInputFields {
  title: string;
  content?: string;
  yarn_info?: string;
  pattern_info?: string;
  pattern_url?: string;
  needle_info?: string;
}

// 생성용
export interface CreatePostInput extends PostInputFields {
  images: Array<{ uri: string; name?: string; type?: string }>;
  knitting_logs: Array<{ content: string }>;
}

// 수정용 (모든 필드 optional)
export type UpdatePostInput = Partial<PostInputFields>;
