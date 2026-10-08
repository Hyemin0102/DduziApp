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

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  nickname: string;
  profile_image: string | null;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
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
  pattern_pdf_name?: string | null;
  needle_info?: string | null;
  is_completed: boolean;
  // 'planned'(예정)/'in_progress'(진행 중)/'completed'(완료) — is_completed는
  // DB 트리거가 이 값에서 파생시켜 항상 동기화함('completed'일 때만 true)
  status: 'planned' | 'in_progress' | 'completed';
  visibility: 'public' | 'private';
  likes_enabled: boolean;
  comments_enabled: boolean;
  progress?: number;
  thumbnail_url?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// 프로젝트 목록용
export type ProjectItem = Pick<
  ProjectBase,
  'id' | 'title' | 'created_at' | 'updated_at' | 'is_completed' | 'status' | 'visibility' | 'thumbnail_url' | 'started_at' | 'completed_at'
>;

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
  published_at?: string | null;
  post_images: Array<Pick<PostImage, 'id' | 'image_url' | 'display_order'>>;
  // 좋아요/댓글 배치 조회로 채워주는 필드 — 아직 이 쿼리를 안 하는 화면에서는
  // undefined이므로, 화면마다 이 값들 존재 여부로 좋아요/댓글 UI 노출을 결정함
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
}

// 홈/피드용 (users, post_images, project 조인)
export interface Post extends SimplePost {
  users: {
    id: string;
    nickname: string;
    profile_image: string;
    supporter_level?: 1 | 2 | 3 | null;
    show_supporter_badge?: boolean;
  };
  projects: Pick<
    ProjectBase,
    'id' | 'title' | 'visibility' | 'is_completed' | 'status' | 'likes_enabled' | 'comments_enabled'
  >;
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
  likes_enabled: boolean;
  comments_enabled: boolean;
  likes_count: number;
  is_liked: boolean;
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
