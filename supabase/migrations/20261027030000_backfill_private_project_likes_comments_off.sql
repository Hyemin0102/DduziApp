-- 좋아요/댓글 기능 추가 당시(20261005000000) likes_enabled/comments_enabled
-- 컬럼이 DEFAULT true로 추가되면서, 공개/비공개 구분 없이 기존 프로젝트 전부
-- true로 백필됐었음. 비공개 프로젝트는 어차피 활동 자체가 트리거로 막혀있지만,
-- 프로젝트 상세 설정 화면엔 "켜짐"으로 잘못 보이고 있어서 비공개 프로젝트만
-- 골라 false로 바로잡음. 공개 프로젝트는 작성자가 일부러 꺼놨을 수 있어서 건드리지 않음.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

UPDATE public.projects
SET likes_enabled = false,
    comments_enabled = false
WHERE visibility = 'private';
