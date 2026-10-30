-- 버그: 같은 기기에서 A로그아웃->B로그인 시, device_tokens의 RLS 정책
-- (user_id = auth.uid())이 "이미 A 소유인 토큰 행을 B가 재할당"하는 것을 막아서
-- upsert가 유니크 제약 충돌로 조용히 실패함(클라이언트가 에러를 콘솔에만 찍고 삼킴).
-- 그 결과 기기의 토큰이 영원히 이전 로그인 계정 소유로 남아, 그 계정에게 가야 할
-- 알림이 지금 그 기기에 로그인된(다른) 계정에게 가는 것처럼 보임.
--
-- 해결: RLS를 우회하는 SECURITY DEFINER 함수로 "이 토큰은 지금부터 나(auth.uid())
-- 소유"라고 강제로 재할당할 수 있게 함. 클라이언트는 직접 upsert 대신 이 함수를 호출.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE OR REPLACE FUNCTION public.claim_device_token(p_token text, p_platform text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.device_tokens (user_id, token, platform, updated_at)
  VALUES (auth.uid(), p_token, p_platform, now())
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.claim_device_token(text, text) TO authenticated;

-- 로그아웃 시에도 내 토큰을 정리할 수 있게(선택적 방어 코드용) 자기 자신의 토큰
-- 삭제는 기존 RLS로 이미 허용됨(USING user_id = auth.uid()) -- 별도 조치 불필요.
