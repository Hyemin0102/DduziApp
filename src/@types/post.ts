// types/post.ts

// 기본 테이블 타입
export interface User {
  id: string;
  username: string;
  profile_image: string | null;
  bio: string | null;
  created_at: string;
}

export interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface KnittingLog {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
}

// 게시물 기본 타입
export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  yarn_info: string | null;
  pattern_info: string | null;
  pattern_url: string | null;
  created_at: string;
  updated_at: string;
}

// 게시물 리스트용 타입 (사용자 정보 + 이미지 포함)
export interface PostListItem extends Post {
  user: Pick<User, 'username' | 'profile_image'> | null;
  images: PostImage[];
}

// 게시물 상세용 타입 (모든 정보 포함)
export interface PostDetail extends Post {
  user: Pick<User, 'username' | 'profile_image'> | null;
  images: PostImage[];
  knitting_logs: KnittingLog[];
}

// 게시물 작성용 타입
export interface CreatePostInput {
  title: string;
  content?: string;
  yarn_info?: string;
  pattern_info?: string;
  pattern_url?: string;
  images: Array<{uri: string; name?: string; type?: string}>;
  knitting_logs: Array<{content: string}>;
}

// 게시물 수정용 타입
export interface UpdatePostInput {
  title?: string;
  content?: string;
  yarn_info?: string;
  pattern_info?: string;
  pattern_url?: string;
}