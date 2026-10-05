import React, {useEffect, useState} from 'react';
import {StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import * as S from './ExploreScreen.style';

// /pattern_categories/list.json 실제 응답 기준 permalink (2026-09-29 확인)
export const CATEGORY_OPTIONS = [
  {key: 'sweater', label: '스웨터'},
  {key: 'cardigan', label: '가디건'},
  {key: 'vest', label: '조끼'},
  {key: 'coat', label: '코트/재킷'},
  {key: 'dress', label: '원피스'},
  {key: 'shawl-wrap', label: '숄/스카프'},
  {key: 'scarf', label: '목도리'},
  {key: 'cowl', label: '카울'},
  {key: 'hat', label: '모자'},
  {key: 'hands', label: '장갑'},
  {key: 'socks', label: '양말'},
  {key: 'bag', label: '가방'},
  {key: 'blanket', label: '담요'},
  {key: 'softies', label: '인형/소품'},
] as const;

export const CRAFT_OPTIONS = [
  {key: 'knitting', label: '대바늘'},
  {key: 'crochet', label: '코바늘'},
] as const;

export interface AppliedFilters {
  category: string | null;
  craft: string | null;
  freeOnly: boolean;
  koreanOnly: boolean;
}

interface FilterSheetProps extends AppliedFilters {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: AppliedFilters) => void;
}

// Ravelry pc/craft 파라미터는 여러 값을 pipe(|)로 묶어서 넘기면 됨
// (같은 엔드포인트의 pattern_id 파라미터 문서에 나온 것과 동일한 구분자 규칙)
const toSet = (value: string | null) => new Set(value ? value.split('|') : []);
const toValue = (set: Set<string>) => (set.size > 0 ? Array.from(set).join('|') : null);

export default function FilterSheet({
  visible,
  onClose,
  category,
  craft,
  freeOnly,
  koreanOnly,
  onApply,
}: FilterSheetProps) {
  const [draftCategory, setDraftCategory] = useState<Set<string>>(new Set());
  const [draftCraft, setDraftCraft] = useState<Set<string>>(new Set());
  const [draftFreeOnly, setDraftFreeOnly] = useState(false);
  const [draftKoreanOnly, setDraftKoreanOnly] = useState(false);

  // 시트가 열릴 때마다 현재 적용된 필터값으로 초기화 — 이전에 열었다가 취소한
  // 값이 남아있지 않도록 함
  useEffect(() => {
    if (visible) {
      setDraftCategory(toSet(category));
      setDraftCraft(toSet(craft));
      setDraftFreeOnly(freeOnly);
      setDraftKoreanOnly(koreanOnly);
    }
  }, [visible, category, craft, freeOnly, koreanOnly]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const handleReset = () => {
    setDraftCategory(new Set());
    setDraftCraft(new Set());
    setDraftFreeOnly(false);
    setDraftKoreanOnly(false);
  };

  const handleApply = () => {
    const applied = {
      category: toValue(draftCategory),
      craft: toValue(draftCraft),
      freeOnly: draftFreeOnly,
      koreanOnly: draftKoreanOnly,
    };
    console.log('[ravelry] 필터 적용:', applied);
    onApply(applied);
    onClose();
  };

  return (
    <ActionSheetModal visible={visible} onClose={onClose} showCancel={false}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>카테고리</Text>
        <View style={styles.chipWrap}>
          {CATEGORY_OPTIONS.map(opt => (
            <S.Chip
              key={opt.key}
              active={draftCategory.has(opt.key)}
              onPress={() => toggle(draftCategory, setDraftCategory, opt.key)}>
              <S.ChipText active={draftCategory.has(opt.key)}>{opt.label}</S.ChipText>
            </S.Chip>
          ))}
        </View>

        <Text style={styles.sectionTitle}>종류</Text>
        <View style={styles.chipWrap}>
          {CRAFT_OPTIONS.map(opt => (
            <S.Chip
              key={opt.key}
              active={draftCraft.has(opt.key)}
              onPress={() => toggle(draftCraft, setDraftCraft, opt.key)}>
              <S.ChipText active={draftCraft.has(opt.key)}>{opt.label}</S.ChipText>
            </S.Chip>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>무료 도안만</Text>
          <Switch value={draftFreeOnly} onValueChange={setDraftFreeOnly} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>한국어 도안만</Text>
          <Switch value={draftKoreanOnly} onValueChange={setDraftKoreanOnly} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}>
            <Text style={styles.resetText}>초기화</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.8}>
            <Text style={styles.applyText}>적용하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ActionSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
    marginTop: 16,
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 16,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#191919',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  resetButton: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
