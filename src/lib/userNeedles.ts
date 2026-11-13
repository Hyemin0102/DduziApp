// 서랍장 바늘(user_needles) 상수 / 표시 / 조회·저장·삭제
import {supabase} from '@/lib/supabase';
import {uploadImage} from '@/lib/uploadImage';
import {
  NeedleCategory,
  NeedleType,
  PublicUserNeedle,
  UserNeedle,
  UserNeedleWithProjects,
} from '@/@types/database';
import {InfoRow} from '@/lib/userYarns';

export const NEEDLE_IMAGES_BUCKET = 'needle-images';

// ── 종류 / 모양 ──────────────────────────────────────────

export const NEEDLE_CATEGORIES: {value: NeedleCategory; label: string}[] = [
  {value: 'knitting', label: '대바늘'},
  {value: 'crochet', label: '코바늘'},
];

export const NEEDLE_TYPES: Record<NeedleCategory, {value: NeedleType; label: string}[]> = {
  knitting: [
    {value: 'circular', label: '줄바늘'},
    {value: 'interchangeable', label: '조립식'},
    {value: 'dpn', label: '장갑바늘'},
    {value: 'straight', label: '막대바늘'},
  ],
  crochet: [
    {value: 'crochet', label: '코바늘'},
    {value: 'tunisian', label: '아후강'},
  ],
};

export const categoryLabel = (c: NeedleCategory) =>
  NEEDLE_CATEGORIES.find(x => x.value === c)?.label ?? '';

export const needleTypeLabel = (t: NeedleType) =>
  [...NEEDLE_TYPES.knitting, ...NEEDLE_TYPES.crochet].find(x => x.value === t)?.label ?? '';

// 모양별로 입력받는 길이 항목
export const hasCableLength = (t: NeedleType | null) =>
  t === 'circular' || t === 'interchangeable' || t === 'tunisian';

// ── 선택 칩 기본값 ───────────────────────────────────────

export const SIZE_CHIPS_MM: Record<NeedleCategory, number[]> = {
  knitting: [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 9, 10, 12],
  crochet: [2, 2.3, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 10],
};
export const CABLE_LENGTH_CHIPS_CM = [40, 60, 80, 100, 120, 150];

// ── 호수 ↔ mm 변환표 ─────────────────────────────────────
// 한국에서 흔히 쓰는 호수는 일본식 표기, 해외 브랜드는 US 표기. 제조사마다 조금씩 다를 수 있음

export interface SizeConversion {
  label: string;
  mm: number;
}

export const SIZE_CONVERSIONS: Record<NeedleCategory, {ho: SizeConversion[]; us: SizeConversion[]}> = {
  knitting: {
    ho: [
      {label: '0호', mm: 2.1},
      {label: '1호', mm: 2.4},
      {label: '2호', mm: 2.7},
      {label: '3호', mm: 3},
      {label: '4호', mm: 3.3},
      {label: '5호', mm: 3.6},
      {label: '6호', mm: 3.9},
      {label: '7호', mm: 4.2},
      {label: '8호', mm: 4.5},
      {label: '9호', mm: 4.8},
      {label: '10호', mm: 5.1},
      {label: '11호', mm: 5.4},
      {label: '12호', mm: 5.7},
      {label: '13호', mm: 6},
      {label: '14호', mm: 6.3},
      {label: '15호', mm: 6.6},
    ],
    us: [
      {label: 'US 0', mm: 2},
      {label: 'US 1', mm: 2.25},
      {label: 'US 1.5', mm: 2.5},
      {label: 'US 2', mm: 2.75},
      {label: 'US 2.5', mm: 3},
      {label: 'US 3', mm: 3.25},
      {label: 'US 4', mm: 3.5},
      {label: 'US 5', mm: 3.75},
      {label: 'US 6', mm: 4},
      {label: 'US 7', mm: 4.5},
      {label: 'US 8', mm: 5},
      {label: 'US 9', mm: 5.5},
      {label: 'US 10', mm: 6},
      {label: 'US 10.5', mm: 6.5},
      {label: 'US 11', mm: 8},
      {label: 'US 13', mm: 9},
      {label: 'US 15', mm: 10},
      {label: 'US 17', mm: 12},
    ],
  },
  crochet: {
    ho: [
      {label: '2/0호', mm: 2},
      {label: '3/0호', mm: 2.3},
      {label: '4/0호', mm: 2.5},
      {label: '5/0호', mm: 3},
      {label: '6/0호', mm: 3.5},
      {label: '7/0호', mm: 4},
      {label: '7.5/0호', mm: 4.5},
      {label: '8/0호', mm: 5},
      {label: '10/0호', mm: 6},
    ],
    us: [
      {label: 'B-1', mm: 2.25},
      {label: 'C-2', mm: 2.75},
      {label: 'D-3', mm: 3.25},
      {label: 'E-4', mm: 3.5},
      {label: 'F-5', mm: 3.75},
      {label: 'G-6', mm: 4},
      {label: '7', mm: 4.5},
      {label: 'H-8', mm: 5},
      {label: 'I-9', mm: 5.5},
      {label: 'J-10', mm: 6},
      {label: 'K-10.5', mm: 6.5},
      {label: 'L-11', mm: 8},
      {label: 'M/N-13', mm: 9},
      {label: 'N/P-15', mm: 10},
    ],
  },
};

// ── 표시 ─────────────────────────────────────────────────

export const formatMm = (mm: number) => `${Number(mm)}mm`;

const sortNum = (arr: number[]) => [...arr].map(Number).sort((a, b) => a - b);

// "3–8mm" (세트) / "4mm" (단품)
export const formatSizeRange = (sizes: number[]) => {
  const s = sortNum(sizes);
  if (s.length === 0) return '';
  if (s.length === 1 || s[0] === s[s.length - 1]) return formatMm(s[0]);
  return `${s[0]}–${s[s.length - 1]}mm`;
};

// 이름이 비어 있을 때 자동 이름
// 단품: "브랜드 4mm 줄바늘 80cm" / 세트: "브랜드 조립식 세트 3–8mm"
export const needleAutoName = (
  n: Pick<UserNeedle, 'brand' | 'needle_type' | 'is_set' | 'sizes_mm' | 'cable_lengths_cm'>,
) => {
  const shape = needleTypeLabel(n.needle_type);
  const brand = n.brand?.trim() || null;
  if (n.is_set) {
    return [brand, `${shape} 세트`, formatSizeRange(n.sizes_mm)].filter(Boolean).join(' ');
  }
  const length = n.cable_lengths_cm[0];
  return [brand, n.sizes_mm[0] != null ? formatMm(n.sizes_mm[0]) : null, shape, length ? `${length}cm` : null]
    .filter(Boolean)
    .join(' ');
};

export const needleDisplayName = (n: PublicUserNeedle) => n.name?.trim() || needleAutoName(n);

// "대바늘 · 줄바늘 · 세트"
export const needleSubText = (n: Pick<UserNeedle, 'category' | 'needle_type' | 'is_set'>) =>
  [categoryLabel(n.category), needleTypeLabel(n.needle_type), n.is_set ? '세트' : '단품'].join(' · ');

// "3mm, 3.5mm, 4mm" — 호수는 mm와 1:1로 맞지 않아 표시하지 않음 (폼의 변환표로 참고)
export const formatSizes = (n: Pick<UserNeedle, 'sizes_mm'>) => sortNum(n.sizes_mm).map(formatMm).join(', ');

// 상세 화면 / 프로젝트에서 보는 바늘 정보 공통 표시 행
export const needleInfoRows = (n: PublicUserNeedle): {spec: InfoRow[]; purchase: InfoRow[]} => ({
  spec: [
    ['구성', needleSubText(n)],
    ['호수', formatSizes(n)],
    ['케이블 길이', n.cable_lengths_cm.length ? n.cable_lengths_cm.map(v => `${v}cm`).join(', ') : null],
  ],
  purchase: [
    ['구매처', n.purchase_place],
    ['구매일', n.purchased_at ? n.purchased_at.replace(/-/g, '.') : null],
    ['가격', n.price != null ? `${n.price.toLocaleString('ko-KR')}원` : null],
  ],
});

// ── 폼 ───────────────────────────────────────────────────

export interface NeedleFormValues {
  category: NeedleCategory | null;
  needleType: NeedleType | null;
  isSet: boolean;
  name: string;
  brand: string;
  sizesMm: number[];
  cableLengthsCm: number[];
  purchasePlace: string;
  purchasedAt: string | null; // YYYY-MM-DD
  price: string;
  memo: string;
  imageUrl: string | null;
}

export const EMPTY_NEEDLE_FORM: NeedleFormValues = {
  category: null,
  needleType: null,
  isSet: false,
  name: '',
  brand: '',
  sizesMm: [],
  cableLengthsCm: [],
  purchasePlace: '',
  purchasedAt: null,
  price: '',
  memo: '',
  imageUrl: null,
};

export const needleToForm = (n: UserNeedle): NeedleFormValues => ({
  category: n.category,
  needleType: n.needle_type,
  isSet: n.is_set,
  name: n.name ?? '',
  brand: n.brand ?? '',
  sizesMm: sortNum(n.sizes_mm ?? []),
  cableLengthsCm: sortNum(n.cable_lengths_cm ?? []),
  purchasePlace: n.purchase_place ?? '',
  purchasedAt: n.purchased_at,
  price: n.price != null ? String(n.price) : '',
  memo: n.memo ?? '',
  imageUrl: n.image_url,
});

// ── Storage ──────────────────────────────────────────────

const isLocalUri = (uri: string | null) => !!uri && !/^https?:\/\//.test(uri);

const removeNeedleImage = async (url: string | null) => {
  if (!url) return;
  const marker = `/${NEEDLE_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return;
  const path = url.slice(idx + marker.length).split('?')[0];
  const {error} = await supabase.storage.from(NEEDLE_IMAGES_BUCKET).remove([path]);
  if (error) console.error('바늘 사진 삭제 실패:', error);
};

const textOrNull = (v: string) => (v.trim() ? v.trim() : null);

// ── 조회 / 저장 / 삭제 ───────────────────────────────────

export const fetchMyNeedles = async (userId: string): Promise<UserNeedle[]> => {
  const {data, error} = await supabase
    .from('user_needles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false});
  if (error) throw error;
  return data ?? [];
};

export const fetchNeedle = async (needleId: string): Promise<UserNeedleWithProjects> => {
  const {data, error} = await supabase
    .from('user_needles')
    .select('*, user_needle_projects(projects(id, title, thumbnail_url, status))')
    .eq('id', needleId)
    .single();
  if (error) throw error;
  const {user_needle_projects, ...needle} = data as any;
  return {
    ...needle,
    projects: (user_needle_projects ?? []).map((l: any) => l.projects).filter(Boolean),
  };
};

interface SaveNeedleParams {
  userId: string;
  needleId?: string; // 있으면 수정
  form: NeedleFormValues;
  previousImageUrl?: string | null; // 교체/삭제됐으면 Storage에서 정리
  projectIds: string[];
  previousProjectIds?: string[];
}

export const saveNeedle = async ({
  userId,
  needleId,
  form,
  previousImageUrl = null,
  projectIds,
  previousProjectIds = [],
}: SaveNeedleParams): Promise<string> => {
  if (!form.category || !form.needleType || form.sizesMm.length === 0) {
    throw new Error('종류, 모양, 호수를 선택해주세요.');
  }

  let imageUrl = form.imageUrl;
  if (isLocalUri(imageUrl)) {
    imageUrl = await uploadImage(imageUrl!, NEEDLE_IMAGES_BUCKET, userId);
    if (!imageUrl) throw new Error('사진 업로드에 실패했어요.');
  }

  // 단품은 각 항목 1개만, 케이블이 없는 모양은 케이블 길이를 비움
  const pick = (arr: number[]) => (form.isSet ? sortNum(arr) : sortNum(arr).slice(0, 1));
  const parsedPrice = parseInt(form.price, 10);

  const row = {
    user_id: userId,
    category: form.category,
    needle_type: form.needleType,
    is_set: form.isSet,
    name: textOrNull(form.name),
    brand: textOrNull(form.brand),
    sizes_mm: pick(form.sizesMm),
    cable_lengths_cm: hasCableLength(form.needleType) ? pick(form.cableLengthsCm) : [],
    purchase_place: textOrNull(form.purchasePlace),
    purchased_at: form.purchasedAt,
    price: Number.isFinite(parsedPrice) ? parsedPrice : null,
    memo: textOrNull(form.memo),
    image_url: imageUrl,
  };

  let savedId = needleId;
  if (needleId) {
    const {error} = await supabase.from('user_needles').update(row).eq('id', needleId);
    if (error) throw error;
  } else {
    const {data, error} = await supabase.from('user_needles').insert(row).select('id').single();
    if (error) throw error;
    savedId = data.id;
  }

  // 연결된 프로젝트 동기화 (추가/해제분만 반영)
  const toAdd = projectIds.filter(id => !previousProjectIds.includes(id));
  const toRemove = previousProjectIds.filter(id => !projectIds.includes(id));
  if (toRemove.length > 0) {
    const {error} = await supabase
      .from('user_needle_projects')
      .delete()
      .eq('needle_id', savedId!)
      .in('project_id', toRemove);
    if (error) throw error;
  }
  if (toAdd.length > 0) {
    const {error} = await supabase
      .from('user_needle_projects')
      .insert(toAdd.map(project_id => ({needle_id: savedId, project_id})));
    if (error) throw error;
  }

  if (previousImageUrl && previousImageUrl !== imageUrl) {
    await removeNeedleImage(previousImageUrl);
  }

  return savedId!;
};

export const deleteNeedle = async (needle: Pick<UserNeedle, 'id' | 'image_url'>) => {
  const {error} = await supabase.from('user_needles').delete().eq('id', needle.id);
  if (error) throw error;
  await removeNeedleImage(needle.image_url);
};
