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
  post_id: string;
  image_url: string;
  display_order: number;
  created_at?: string;
}

export interface KnittingLog {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
}

// ================================
// 프로젝트 타입 (projects 테이블)
// ================================

export interface ProjectBase {
  id: string;
  user_id: string;
  title: string;
  content?: string | null;
  yarn_info?: string | null;
  pattern_info?: string | null;
  pattern_url?: string | null;
  needle_info?: string | null;
  is_completed: boolean;
  visibility: 'public' | 'private';
  progress?: number;
  created_at: string;
  updated_at: string;
}

// 프로젝트 목록용
export type ProjectItem = Pick;
ProjectBase,
  'id' | 'title' | 'created_at' | 'updated_at' | 'is_completed' | 'visibility';

// 프로젝트 상세용 (knitting_logs 포함)
export interface ProjectDetail extends ProjectBase {
  knitting_logs: KnittingLog[];
  posts: SimplePost[];
}

// ================================
// 게시물 타입 (posts 테이블)
// ================================

export interface SimplePost {
  id: string;
  user_id: string;
  project_id: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
  post_images: Array<Pick<PostImage, 'id' | 'image_url' | 'display_order'>>;
}

// 홈/피드용 (users, post_images, project 조인)
export interface Post extends SimplePost {
  users: {
    id: string;
    nickname: string;
    profile_image: string;
  };
  projects: Pick<ProjectBase, 'id' | 'title' | 'visibility' | 'is_completed'>;
}

// 상세 페이지용 (플랫 구조)
export interface PostDetail {
  id: string;
  user_id: string;
  project_id: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
  nickname: string;
  profile_image: string | null;
  images: PostImage[];
  title: string;
  yarn_info?: string | null;
  needle_info?: string | null;
  pattern_info?: string | null;
  pattern_url?: string | null;
  is_completed: boolean;
  visibility: 'public' | 'private';
}

// ================================
// 입력용 타입
// ================================

export interface CreateProjectInput {
  title: string;
  content?: string;
  yarn_info?: string;
  pattern_info?: string;
  pattern_url?: string;
  needle_info?: string;
  visibility?: 'public' | 'private';
}

export interface CreatePostInput {
  project_id: string;
  content?: string;
  images: Array<{uri: string; name?: string; type?: string}>;
}
