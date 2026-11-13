import {supabase} from '@/lib/supabase';

// 레이블리 실 응답(yarns/{id}.json) → 서랍장 실 입력 폼 값 변환

// 서랍장 실 입력 폼 값. TextInput에 바로 물리기 위해 숫자 항목도 문자열로 관리함
export interface YarnFormValues {
  name: string;
  brand: string;
  color: string;
  lot: string;
  ply: string;
  fiber: string;
  gauge: string;
  needleSize: string;
  ballCount: string;
  gramsPerBall: string;
  metersPerBall: string;
  purchasePlace: string;
  purchasedAt: string | null; // YYYY-MM-DD
  price: string;
  memo: string;
  customImageUrl: string | null;
  ravelryImageUrl: string | null;
  ravelryYarnId: number | null;
}

export const EMPTY_YARN_FORM: YarnFormValues = {
  name: '',
  brand: '',
  color: '',
  lot: '',
  ply: '',
  fiber: '',
  gauge: '',
  needleSize: '',
  ballCount: '',
  gramsPerBall: '',
  metersPerBall: '',
  purchasePlace: '',
  purchasedAt: null,
  price: '',
  memo: '',
  customImageUrl: null,
  ravelryImageUrl: null,
  ravelryYarnId: null,
};

// 프로젝트별 실 용도 기본 태그 (직접 만든 태그는 그 프로젝트의 그 실에만 붙음)
export const DEFAULT_PURPOSE_TAGS = ['메인', '배색', '합사'];

// Ravelry yardage는 야드 단위 (1yd = 0.9144m)
export const yardsToMeters = (yards: number) => Math.round(yards * 0.9144);

// "Merino 100%, Silk 30%"
const formatFiber = (fibers: any[] | undefined) =>
  (fibers ?? [])
    .map(f => {
      const name = f?.fiber_type?.name;
      if (!name) return null;
      return f.percentage ? `${name} ${f.percentage}%` : name;
    })
    .filter(Boolean)
    .join(', ');

// gauge_divisor는 인치 단위 (4 → 4인치 = 10cm)
const formatGauge = (min?: number | null, max?: number | null, divisor?: number | null) => {
  const sts = min && max && min !== max ? `${min}–${max}` : min || max;
  if (!sts) return '';
  const per = !divisor || divisor === 4 ? '10cm' : `${divisor}인치`;
  return `${sts}코 / ${per}`;
};

// "2.5–3.5mm"
const formatNeedle = (min?: {metric?: number} | null, max?: {metric?: number} | null) => {
  const a = min?.metric;
  const b = max?.metric;
  if (a && b && a !== b) return `${a}–${b}mm`;
  if (a || b) return `${a || b}mm`;
  return '';
};

// yarn_weight.ply는 굵기 등급(Lace=2 등)의 표준값이라 실제 합수와 다를 수 있음
// ("Argo 3 ply"인데 ply가 "2"로 옴) → 이름에 "N ply"가 있으면 그걸 우선 사용
const guessPly = (name: string, weightPly?: string | null) => {
  const fromName = name.match(/(\d+)\s*-?\s*ply/i)?.[1];
  return fromName || weightPly?.trim() || '';
};

export const ravelryYarnToForm = (yarn: any): YarnFormValues => {
  const photo = yarn?.first_photo ?? yarn?.photos?.[0];
  return {
    ...EMPTY_YARN_FORM,
    name: yarn?.name ?? '',
    brand: yarn?.yarn_company?.name ?? yarn?.yarn_company_name ?? '',
    ply: guessPly(yarn?.name ?? '', yarn?.yarn_weight?.ply),
    fiber: formatFiber(yarn?.yarn_fibers),
    gauge: formatGauge(yarn?.min_gauge, yarn?.max_gauge, yarn?.gauge_divisor),
    needleSize: formatNeedle(yarn?.min_needle_size, yarn?.max_needle_size),
    gramsPerBall: yarn?.grams ? String(yarn.grams) : '',
    metersPerBall: yarn?.yardage ? String(yardsToMeters(yarn.yardage)) : '',
    ravelryImageUrl: photo?.medium_url ?? photo?.small_url ?? null,
    ravelryYarnId: yarn?.id ?? null,
  };
};

// ── Ravelry edge function 호출 / 컬러웨이 ───────────────────

// FunctionsHttpError의 message는 "non-2xx status code"뿐이라 실제 원인은 context(Response) body에 있음
export const invokeRavelryFunction = async (name: string, body: Record<string, unknown>) => {
  const {data, error} = await supabase.functions.invoke(name, {body});
  if (error) {
    const detail = await (error as any).context?.text?.().catch(() => null);
    throw new Error(detail || error.message);
  }
  if (data?.error) throw new Error(JSON.stringify(data));
  return data;
};

// Ravelry 컬러웨이 (yarns/{id}.json?include=colorways → Colorway (full))
// 문서상 photo_url/usage_count도 있지만 실제 응답엔 오지 않음 (hex 색상값은 문서에도 없음)
export interface RavelryColorway {
  id: number;
  code: string | null;
  name: string;
  projects_count: number;
  stashes_count: number;
  yarn_id: number;
}

// 앱 실행 중 재사용 — 검색 화면에서 상세 조회 때 받아둔 값을 색상 선택 화면이 바로 씀
const colorwayCache = new Map<number, RavelryColorway[]>();

export const cacheColorways = (yarnId: number, colorways: RavelryColorway[] | null | undefined) => {
  if (Array.isArray(colorways)) colorwayCache.set(yarnId, colorways);
};

export const fetchColorways = async (yarnId: number): Promise<RavelryColorway[]> => {
  const cached = colorwayCache.get(yarnId);
  if (cached) return cached;
  const data = await invokeRavelryFunction('ravelry-yarn-detail', {
    ids: [yarnId],
    include: ['colorways'],
  });
  const colorways: RavelryColorway[] = data?.yarns?.[0]?.colorways ?? [];
  colorwayCache.set(yarnId, colorways);
  return colorways;
};

// 폼 색상 칸에 저장되는 표시값: "Jade (#6)"
export const formatColorway = (c: Pick<RavelryColorway, 'name' | 'code'>) =>
  c.code ? `${c.name} (#${c.code})` : c.name;
