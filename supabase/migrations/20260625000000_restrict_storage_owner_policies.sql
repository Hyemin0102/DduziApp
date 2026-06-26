-- profile / pattern-pdfs / post-images 버킷에서 본인 소유 파일만 쓰기(INSERT/UPDATE/DELETE) 가능하도록 제한
-- 업로드 경로 규칙: profile/{userId}/..., pattern-pdfs/{userId}/..., post-images/{postId}/...
-- (storage.foldername(name))[1] 이 경로의 첫 폴더 세그먼트(userId 또는 postId)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

-- ── profile 버킷: 기존엔 "Anyone"(비로그인 포함)이 INSERT/UPDATE/DELETE 전부 가능했음
DROP POLICY IF EXISTS "Anyone can delete profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload profile images" ON storage.objects;
-- "Anyone can view profile images" (SELECT)는 유지 — 다른 유저 프로필 사진을 화면에 표시해야 하므로 공개 읽기는 의도된 동작

CREATE POLICY "Users can upload own profile images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own profile images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own profile images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profile'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ── pattern-pdfs 버킷: 기존엔 로그인만 하면(소유자 검증 없이) 누구나 INSERT/UPDATE/DELETE 가능했음
DROP POLICY IF EXISTS "authenticated_delete_pattern_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_insert_pattern_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_pattern_pdfs" ON storage.objects;
-- "public_select_pattern_pdfs" (SELECT)는 별개 이슈(버킷 자체가 public이라 RLS와 무관하게 URL로 누구나 열람 가능)로 이번 변경 범위 밖

CREATE POLICY "authenticated_insert_pattern_pdfs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pattern-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "authenticated_update_pattern_pdfs" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'pattern-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "authenticated_delete_pattern_pdfs" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'pattern-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ── post-images 버킷: DELETE/UPDATE는 이미 posts.user_id 기준으로 소유자 검증이 되어 있어 그대로 둠.
-- INSERT("Authenticated users can upload post images")만 소유자 검증이 없어서, 로그인만 하면
-- 다른 사람의 post 폴더에도 업로드가 가능한 상태 — 같은 방식으로 본인 게시물 폴더로 제한
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;

CREATE POLICY "Authenticated users can upload own post images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id::text = (storage.foldername(name))[1]
    AND posts.user_id = auth.uid()
  )
);
