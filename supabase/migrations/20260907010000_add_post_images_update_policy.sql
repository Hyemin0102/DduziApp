-- post_images 테이블에 UPDATE 정책이 없어서, display_order 변경 등 업데이트가
-- RLS에 의해 조용히 (에러 없이 0행 반영) 무시되던 문제 수정
--
-- 적용 방법: Supabase Dashboard → SQL Editor에 붙여넣어 실행

CREATE POLICY "Users can update own post images" ON public.post_images
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_images.post_id
    AND posts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_images.post_id
    AND posts.user_id = auth.uid()
  )
);
