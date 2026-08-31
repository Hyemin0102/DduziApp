-- post-images 버킷의 기존 INSERT/UPDATE/DELETE 정책은 경로 첫 폴더가 본인 소유 posts.id여야 통과되는데,
-- 프로젝트 썸네일은 project-thumbnails/{userId}/... 경로로 업로드되어 어떤 posts.id와도 매치되지 않아
-- "new row violates row-level security policy" 에러가 발생함.
-- project-thumbnails/{userId}/... 경로는 본인 폴더에 한해 쓸 수 있도록 별도 정책 추가.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE POLICY "Users can upload own project thumbnails" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = 'project-thumbnails'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update own project thumbnails" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = 'project-thumbnails'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own project thumbnails" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = 'project-thumbnails'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
