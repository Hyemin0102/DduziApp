-- pattern-pdfs 버킷을 private으로 전환 (UI에서 "나만 볼 수 있어요"라고 안내하지만,
-- 버킷이 public이면 /object/public/... 엔드포인트가 RLS를 우회해 누구나 URL로 열람 가능했음)
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

UPDATE storage.buckets SET public = false WHERE id = 'pattern-pdfs';

-- 버킷이 private으로 바뀌면 createSignedUrl()도 SELECT 정책을 거치므로,
-- 기존의 "누구나 읽기 가능" 정책을 본인 폴더만 읽도록 교체
DROP POLICY IF EXISTS "public_select_pattern_pdfs" ON storage.objects;

CREATE POLICY "authenticated_select_pattern_pdfs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'pattern-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
