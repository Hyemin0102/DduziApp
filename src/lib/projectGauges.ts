// 프로젝트 게이지 조회/저장/삭제
import {supabase} from '@/lib/supabase';
import {ProjectGauge} from '@/@types/database';

export type GaugeDraft = Pick<ProjectGauge, 'stitches' | 'rows' | 'needle_mm' | 'pattern'>;

// "22코 × 30단 / 10cm · 4mm · 메리야스"
export const formatGauge = (g: GaugeDraft) =>
  [
    `${Number(g.stitches)}코${g.rows != null ? ` × ${Number(g.rows)}단` : ''} / 10cm`,
    g.needle_mm != null ? `${Number(g.needle_mm)}mm` : null,
    g.pattern?.trim() || null,
  ]
    .filter(Boolean)
    .join(' · ');

export const fetchProjectGauges = async (projectId: string): Promise<ProjectGauge[]> => {
  const {data, error} = await supabase
    .from('project_gauges')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', {ascending: true});
  if (error) throw error;
  return data ?? [];
};

const toRow = (g: GaugeDraft) => ({
  stitches: g.stitches,
  rows: g.rows,
  needle_mm: g.needle_mm,
  pattern: g.pattern?.trim() || null,
});

export const addProjectGauges = async (projectId: string, gauges: GaugeDraft[]) => {
  if (gauges.length === 0) return;
  const {error} = await supabase
    .from('project_gauges')
    .insert(gauges.map(g => ({...toRow(g), project_id: projectId})));
  if (error) throw error;
};

export const updateProjectGauge = async (gaugeId: string, gauge: GaugeDraft) => {
  const {error} = await supabase.from('project_gauges').update(toRow(gauge)).eq('id', gaugeId);
  if (error) throw error;
};

export const deleteProjectGauge = async (gaugeId: string) => {
  const {error} = await supabase.from('project_gauges').delete().eq('id', gaugeId);
  if (error) throw error;
};
