-- post-images 버킷에 파일당 10MB 업로드 제한 적용 (클라이언트 리사이즈를 우회해도
-- Storage API 직접 호출로 큰 파일을 올리지 못하도록 서버 측에서 강제)
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB
WHERE id = 'post-images';
