// 서랍장 실(user_yarns) 조회/저장/삭제
import {supabase} from '@/lib/supabase';
import {uploadImage} from '@/lib/uploadImage';
import {PublicUserYarn, UserYarn, UserYarnWithProjects} from '@/@types/database';
import {YarnFormValues} from '@/lib/ravelryYarn';

export const YARN_IMAGES_BUCKET = 'yarn-images';

// 업로드한 사진이 있으면 우선, 없으면 레이블리 사진
export const yarnImageUrl = (yarn: Pick<UserYarn, 'custom_image_url' | 'ravelry_image_url'>) =>
  yarn.custom_image_url || yarn.ravelry_image_url || null;

export type InfoRow = [label: string, value: string | null];

// 상세 화면 / 프로젝트에서 보는 실 정보 공통 표시 행 (값 없는 행은 화면에서 걸러냄)
export const yarnInfoRows = (yarn: PublicUserYarn): {spec: InfoRow[]; purchase: InfoRow[]} => {
  const perBall = [
    yarn.grams_per_ball ? `${yarn.grams_per_ball}g` : null,
    yarn.meters_per_ball ? `${yarn.meters_per_ball}m` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const quantity =
    yarn.ball_count != null
      ? yarn.grams_per_ball
        ? `${yarn.ball_count}볼 (${Math.round(yarn.ball_count * yarn.grams_per_ball * 10) / 10}g)`
        : `${yarn.ball_count}볼`
      : null;

  return {
    spec: [
      ['색상', yarn.color],
      ['LOT', yarn.lot],
      ['합수', yarn.ply ? `${yarn.ply}합` : null],
      ['성분', yarn.fiber],
      ['게이지', yarn.gauge],
      ['권장 바늘', yarn.needle_size],
      ['볼당', perBall || null],
    ],
    purchase: [
      ['구매량', quantity],
      ['구매처', yarn.purchase_place],
      ['구매일', yarn.purchased_at ? yarn.purchased_at.replace(/-/g, '.') : null],
      ['가격', yarn.price != null ? `${yarn.price.toLocaleString('ko-KR')}원` : null],
    ],
  };
};

// "색상 · LOT 3427"
export const yarnSubText = (yarn: Pick<UserYarn, 'color' | 'lot'>) =>
  [yarn.color, yarn.lot ? `LOT ${yarn.lot}` : null].filter(Boolean).join(' · ');

// 125 → "125g", 볼당 중량이 있으면 "125g (2.5볼)"
export const formatGramsWithBalls = (grams: number, gramsPerBall?: number | null) => {
  const g = `${Math.round(Number(grams) * 10) / 10}g`;
  if (!gramsPerBall) return g;
  return `${g} (${Math.round((Number(grams) / Number(gramsPerBall)) * 10) / 10}볼)`;
};

// 남은 양 = 구매량(볼 수 × 볼당 중량) − 프로젝트별 사용량 합계
// 구매량/볼당 중량을 모르면 계산 불가(null). 음수면 구매량 업데이트가 필요한 상태
export const yarnRemaining = (
  yarn: Pick<UserYarn, 'ball_count' | 'grams_per_ball'>,
  usages: (number | null | undefined)[],
) => {
  const used = usages.reduce<number>((sum, g) => sum + (g ? Number(g) : 0), 0);
  if (yarn.ball_count == null || !yarn.grams_per_ball) return {used, remaining: null};
  const total = yarn.ball_count * Number(yarn.grams_per_ball);
  return {used, remaining: Math.round((total - used) * 10) / 10};
};

export interface YarnProjectUsage {
  usedGrams: number | null;
  purposeTags: string[];
}

// "메인 · 125g (2.5볼)" — 프로젝트별 용도/사용량 요약
export const formatYarnUsage = (
  usage: {used_grams?: number | null; purpose_tags?: string[]},
  gramsPerBall?: number | null,
) =>
  [
    ...(usage.purpose_tags ?? []),
    usage.used_grams != null ? formatGramsWithBalls(usage.used_grams, gramsPerBall) : null,
  ]
    .filter(Boolean)
    .join(' · ');

// 프로젝트에서 이 실의 사용량/용도 저장 (사용량 null이면 지움)
export const updateYarnUsage = async (
  yarnId: string,
  projectId: string,
  {usedGrams, purposeTags}: YarnProjectUsage,
) => {
  const {error} = await supabase
    .from('user_yarn_projects')
    .update({used_grams: usedGrams, purpose_tags: purposeTags})
    .eq('yarn_id', yarnId)
    .eq('project_id', projectId);
  if (error) throw error;
};

const isLocalUri = (uri: string | null) => !!uri && !/^https?:\/\//.test(uri);

// 공개 URL에서 버킷 내부 경로 추출: .../object/public/yarn-images/{userId}/{file} → {userId}/{file}
const storagePathFromUrl = (url: string) => {
  const marker = `/${YARN_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length).split('?')[0] : null;
};

const removeYarnImage = async (url: string | null) => {
  if (!url) return;
  const path = storagePathFromUrl(url);
  if (!path) return;
  const {error} = await supabase.storage.from(YARN_IMAGES_BUCKET).remove([path]);
  if (error) console.error('실 사진 삭제 실패:', error);
};

const textOrNull = (v: string) => (v.trim() ? v.trim() : null);
const numberOrNull = (v: string, integer = false) => {
  const n = integer ? parseInt(v, 10) : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

export const fetchMyYarns = async (userId: string): Promise<UserYarn[]> => {
  const {data, error} = await supabase
    .from('user_yarns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false});
  if (error) throw error;
  return data ?? [];
};

export const fetchYarn = async (yarnId: string): Promise<UserYarnWithProjects> => {
  const {data, error} = await supabase
    .from('user_yarns')
    .select('*, user_yarn_projects(used_grams, purpose_tags, projects(id, title, thumbnail_url, status))')
    .eq('id', yarnId)
    .single();
  if (error) throw error;
  const {user_yarn_projects, ...yarn} = data as any;
  return {
    ...yarn,
    projects: (user_yarn_projects ?? [])
      .filter((l: any) => l.projects)
      .map((l: any) => ({...l.projects, used_grams: l.used_grams ?? null, purpose_tags: l.purpose_tags ?? []})),
  };
};

export const yarnToForm = (yarn: UserYarn): YarnFormValues => ({
  name: yarn.name,
  brand: yarn.brand ?? '',
  color: yarn.color ?? '',
  lot: yarn.lot ?? '',
  ply: yarn.ply ?? '',
  fiber: yarn.fiber ?? '',
  gauge: yarn.gauge ?? '',
  needleSize: yarn.needle_size ?? '',
  ballCount: yarn.ball_count != null ? String(yarn.ball_count) : '',
  gramsPerBall: yarn.grams_per_ball != null ? String(yarn.grams_per_ball) : '',
  metersPerBall: yarn.meters_per_ball != null ? String(yarn.meters_per_ball) : '',
  purchasePlace: yarn.purchase_place ?? '',
  purchasedAt: yarn.purchased_at,
  price: yarn.price != null ? String(yarn.price) : '',
  memo: yarn.memo ?? '',
  customImageUrl: yarn.custom_image_url,
  ravelryImageUrl: yarn.ravelry_image_url,
  ravelryYarnId: yarn.ravelry_yarn_id,
});

interface SaveYarnParams {
  userId: string;
  yarnId?: string; // 있으면 수정
  form: YarnFormValues;
  // 수정 전 업로드 사진 URL — 교체/삭제됐으면 Storage에서 정리
  previousCustomImageUrl?: string | null;
  projectIds: string[];
  previousProjectIds?: string[];
}

export const saveYarn = async ({
  userId,
  yarnId,
  form,
  previousCustomImageUrl = null,
  projectIds,
  previousProjectIds = [],
}: SaveYarnParams): Promise<string> => {
  // 새로 고른 사진(로컬 URI)은 저장 시점에 업로드
  let customImageUrl = form.customImageUrl;
  if (isLocalUri(customImageUrl)) {
    customImageUrl = await uploadImage(customImageUrl!, YARN_IMAGES_BUCKET, userId);
    if (!customImageUrl) throw new Error('사진 업로드에 실패했어요.');
  }

  const row = {
    user_id: userId,
    name: form.name.trim(),
    brand: textOrNull(form.brand),
    color: textOrNull(form.color),
    lot: textOrNull(form.lot),
    ply: textOrNull(form.ply),
    fiber: textOrNull(form.fiber),
    gauge: textOrNull(form.gauge),
    needle_size: textOrNull(form.needleSize),
    ball_count: numberOrNull(form.ballCount, true),
    grams_per_ball: numberOrNull(form.gramsPerBall),
    meters_per_ball: numberOrNull(form.metersPerBall),
    purchase_place: textOrNull(form.purchasePlace),
    purchased_at: form.purchasedAt,
    price: numberOrNull(form.price, true),
    memo: textOrNull(form.memo),
    custom_image_url: customImageUrl,
    ravelry_image_url: form.ravelryImageUrl,
    ravelry_yarn_id: form.ravelryYarnId,
  };

  let savedId = yarnId;
  if (yarnId) {
    const {error} = await supabase.from('user_yarns').update(row).eq('id', yarnId);
    if (error) throw error;
  } else {
    const {data, error} = await supabase.from('user_yarns').insert(row).select('id').single();
    if (error) throw error;
    savedId = data.id;
  }

  // 연결된 프로젝트 동기화 (추가/해제분만 반영)
  const toAdd = projectIds.filter(id => !previousProjectIds.includes(id));
  const toRemove = previousProjectIds.filter(id => !projectIds.includes(id));
  if (toRemove.length > 0) {
    const {error} = await supabase
      .from('user_yarn_projects')
      .delete()
      .eq('yarn_id', savedId!)
      .in('project_id', toRemove);
    if (error) throw error;
  }
  if (toAdd.length > 0) {
    const {error} = await supabase
      .from('user_yarn_projects')
      .insert(toAdd.map(project_id => ({yarn_id: savedId, project_id})));
    if (error) throw error;
  }

  // 업로드 사진이 바뀌었거나 지워졌으면 이전 파일 정리 (DB 저장 성공 후에)
  if (previousCustomImageUrl && previousCustomImageUrl !== customImageUrl) {
    await removeYarnImage(previousCustomImageUrl);
  }

  return savedId!;
};

export const deleteYarn = async (yarn: Pick<UserYarn, 'id' | 'custom_image_url'>) => {
  const {error} = await supabase.from('user_yarns').delete().eq('id', yarn.id);
  if (error) throw error;
  await removeYarnImage(yarn.custom_image_url);
};
