-- pattern-pdfs 버킷에 파일당 20MB 업로드 제한 적용 (클라이언트 체크를 우회해도 막히도록 서버 측 강제)
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

UPDATE storage.buckets
SET file_size_limit = 20971520 -- 20MB
WHERE id = 'pattern-pdfs';
