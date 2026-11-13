-- 프로젝트에 연결된 서랍장 실/바늘 조회
-- 프로젝트가 공개면 다른 사용자도 연결된 실/바늘을 볼 수 있음.
-- 단 개인 기록은 작성자만 봄:
--   - 메모: 작성자 본인도 이 함수로는 받지 않음 (서랍장 상세에서 직접 조회)
--   - 구매 정보(구매처/구매일/가격) + 실의 구매량: 작성자 본인에게만 포함
--
-- user_yarns/user_needles의 RLS는 본인 전용으로 두고, 이 함수(SECURITY DEFINER)로만 공개함.
-- RLS는 행 단위라 "공개 프로젝트에 연결된 실은 누구나 SELECT"로 열면 memo 컬럼까지 같이 노출되기 때문.
--
-- 조회 허용 조건: 프로젝트 소유자 본인 OR (공개 프로젝트 AND 서로 차단 관계 아님)
--   → projects 테이블의 공개 조회 정책과 동일한 기준
--
-- 실 사용량(used_grams): 같은 실을 여러 프로젝트에 나눠 쓰므로 실이 아니라 실-프로젝트 연결에 저장.
--   항상 g 단위로 저장하고(화면에서 볼 단위 입력 시 볼당 중량으로 환산), 공개 프로젝트면 다른 사용자도 볼 수 있음.
--   서랍장 실 상세에서 "구매량 − 프로젝트별 사용량 합계"로 남은 양을 계산함.
-- 실 용도(purpose_tags): 같은 실도 프로젝트마다 메인/배색/합사 등 역할이 달라서 사용량과 같이 연결에 저장.
--   기본 태그(메인/배색/합사) + 사용자가 직접 만든 태그. 직접 만든 태그는 그 연결(이 프로젝트의 이 실)에만 붙음.

ALTER TABLE public.user_yarn_projects
  ADD COLUMN IF NOT EXISTS used_grams NUMERIC(7, 1)
  CHECK (used_grams IS NULL OR used_grams > 0);

ALTER TABLE public.user_yarn_projects
  ADD COLUMN IF NOT EXISTS purpose_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.get_project_drawer_items(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_visibility text;
  v_is_owner boolean;
  v_empty jsonb := jsonb_build_object('yarns', '[]'::jsonb, 'needles', '[]'::jsonb);
BEGIN
  SELECT p.user_id, p.visibility::text
    INTO v_owner, v_visibility
    FROM public.projects p
   WHERE p.id = p_project_id;

  IF v_owner IS NULL THEN
    RETURN v_empty;
  END IF;

  v_is_owner := (v_owner = auth.uid());

  IF NOT (
    v_is_owner
    OR (v_visibility = 'public' AND NOT public.is_blocked_either_way(auth.uid(), v_owner))
  ) THEN
    RETURN v_empty;
  END IF;

  RETURN jsonb_build_object(
    'yarns', COALESCE((
      SELECT jsonb_agg(
               (CASE WHEN v_is_owner
                  THEN to_jsonb(y) - 'memo' - 'user_id'
                  ELSE to_jsonb(y) - 'memo' - 'user_id'
                       - 'ball_count' - 'purchase_place' - 'purchased_at' - 'price'
                END)
               || jsonb_build_object('used_grams', l.used_grams, 'purpose_tags', l.purpose_tags)  -- 이 프로젝트에서의 사용량/용도
               ORDER BY l.created_at)
        FROM public.user_yarn_projects l
        JOIN public.user_yarns y ON y.id = l.yarn_id
       WHERE l.project_id = p_project_id
         AND y.user_id = v_owner
    ), '[]'::jsonb),
    'needles', COALESCE((
      SELECT jsonb_agg(
               CASE WHEN v_is_owner
                 THEN to_jsonb(n) - 'memo' - 'user_id'
                 ELSE to_jsonb(n) - 'memo' - 'user_id'
                      - 'purchase_place' - 'purchased_at' - 'price'
               END
               ORDER BY l.created_at)
        FROM public.user_needle_projects l
        JOIN public.user_needles n ON n.id = l.needle_id
       WHERE l.project_id = p_project_id
         AND n.user_id = v_owner
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_project_drawer_items(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_drawer_items(uuid) TO authenticated;
