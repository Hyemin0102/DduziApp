// 프로젝트 ↔ 서랍장(실/바늘) 연결
import {supabase} from '@/lib/supabase';
import {PublicUserNeedle, PublicUserYarn} from '@/@types/database';

export type DrawerKind = 'yarn' | 'needle';

const LINK_TABLE = {
  yarn: {table: 'user_yarn_projects', itemColumn: 'yarn_id'},
  needle: {table: 'user_needle_projects', itemColumn: 'needle_id'},
} as const;

// 프로젝트에 연결된 실/바늘 (공개 프로젝트면 다른 사용자도 조회 가능, 메모는 제외됨)
export const fetchProjectDrawerItems = async (
  projectId: string,
): Promise<{yarns: PublicUserYarn[]; needles: PublicUserNeedle[]}> => {
  const {data, error} = await supabase.rpc('get_project_drawer_items', {p_project_id: projectId});
  if (error) throw error;
  return {yarns: data?.yarns ?? [], needles: data?.needles ?? []};
};

// 연결 동기화: 추가/해제분만 반영
export const syncProjectDrawerLinks = async (
  kind: DrawerKind,
  projectId: string,
  previousIds: string[],
  nextIds: string[],
) => {
  const {table, itemColumn} = LINK_TABLE[kind];
  const toAdd = nextIds.filter(id => !previousIds.includes(id));
  const toRemove = previousIds.filter(id => !nextIds.includes(id));
  if (toRemove.length > 0) {
    const {error} = await supabase
      .from(table)
      .delete()
      .eq('project_id', projectId)
      .in(itemColumn, toRemove);
    if (error) throw error;
  }
  if (toAdd.length > 0) {
    const {error} = await supabase
      .from(table)
      .insert(toAdd.map(id => ({[itemColumn]: id, project_id: projectId})));
    if (error) throw error;
  }
};
