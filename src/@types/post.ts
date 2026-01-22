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
  image_url: string;
  display_order: number;
  post_id?: string;
  created_at?: string;
}

export interface KnittingLog {
  id: string;
  post_id?: string;
  content: string;
  created_at: string;
}


// 게시물 기본 타입
export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  yarn_info?: string;
  pattern_info?: string;
  pattern_url?: string;
  created_at: string;
  updated_at: string;
  needleInfo?: string;
  users: {
    id: string;
    username: string;
    profile_image: string;
  };
  post_images: Array<{
    id: string;
    image_url: string;
    display_order: number;
  }>;
  is_completed: boolean;
  visibility: 'public' | 'private';
}

export interface MyPost {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  post_images: Array<{
    id: string;
    image_url: string;
    display_order: number;
  }>;
  is_completed: boolean;
  visibility: 'public' | 'private';
}

// 게시물 리스트용 타입 (사용자 정보 추가)
export interface PostListItem extends Post {
  user: Pick<User, 'username' | 'profile_image'> | null;
}

// 게시물 상세용 타입 (모든 정보 포함)
export interface PostDetail {
  id: string;
  user_id: string;
  title: string;
  content: string;
  yarn_info: string;
  pattern_info: string;
  pattern_url: string | null;
  needleInfo: string;
  created_at: string;
  updated_at: string;
  username: string;
  profile_image: string | null;
  images: PostImage[];
  knitting_logs: KnittingLog[];
  is_completed: boolean;
  visibility: 'public' | 'private';
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