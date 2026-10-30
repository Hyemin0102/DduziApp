-- 숨긴 댓글은 게시물 소유자(숨긴 사람 본인)한테도 안 보이게 변경.
-- 기존엔 "숨긴 목록 확인용"으로 게시물 소유자는 예외적으로 볼 수 있게 했는데,
-- 그 용도의 UI(되돌리기 등)가 없어서 그냥 완전히 숨기는 쪽으로 단순화함.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

DROP POLICY IF EXISTS "View visible comments, owner can see own hidden ones" ON public.comments;

CREATE POLICY "View visible comments only" ON public.comments
FOR SELECT TO authenticated
USING (is_hidden = false);
