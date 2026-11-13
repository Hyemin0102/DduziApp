import React, {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, View} from 'react-native';
import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {useAuth} from '@/contexts/AuthContext';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import KeyboardSheet from '@/components/modal/KeyboardSheet';
import {DRAWER_ROUTES} from '@/constants/navigation.constant';
import {
  ProjectLinkedYarn,
  PublicUserNeedle,
  PublicUserYarn,
} from '@/@types/database';
import {DrawerKind} from '@/lib/projectDrawerLinks';
import {DEFAULT_PURPOSE_TAGS} from '@/lib/ravelryYarn';
import {
  InfoRow,
  YarnProjectUsage,
  fetchMyYarns,
  formatGramsWithBalls,
  formatYarnUsage,
  yarnImageUrl,
  yarnInfoRows,
  yarnSubText,
} from '@/lib/userYarns';
import {
  fetchMyNeedles,
  formatSizeRange,
  needleDisplayName,
  needleInfoRows,
  needleSubText,
} from '@/lib/userNeedles';

type DrawerItem = ProjectLinkedYarn | PublicUserNeedle;

interface Props {
  kind: DrawerKind;
  // "실" / "바늘" 라벨 — 같은 줄 오른쪽에 "서랍에서 고르기" 버튼을 둠
  label: React.ReactNode;
  items: DrawerItem[];
  // 내 프로젝트(또는 작성 중)일 때만 고르기/추가 가능
  editable: boolean;
  isCreateMode: boolean;
  projectId?: string;
  // 선택 완료 시 호출 — 작성 모드면 화면 상태만, 기존 프로젝트면 DB 연결까지 반영
  onChangeSelection: (
    ids: string[],
    selectedItems: DrawerItem[],
  ) => Promise<void>;
  // 이 프로젝트에서의 실 용도/사용량 저장 — 실에만 사용
  onChangeUsage?: (yarnId: string, usage: YarnProjectUsage) => Promise<void>;
}

const LABEL = {yarn: '실', needle: '바늘'} as const;

// 목록/시트에 보여줄 공통 표시값
const toDisplay = (kind: DrawerKind, item: DrawerItem) => {
  if (kind === 'yarn') {
    const y = item as PublicUserYarn;
    return {
      image: yarnImageUrl(y),
      title: y.name,
      sub: [y.brand, yarnSubText(y)].filter(Boolean).join(' · '),
    };
  }
  const n = item as PublicUserNeedle;
  return {
    image: n.image_url,
    title: needleDisplayName(n),
    sub: `${needleSubText(n)} · ${formatSizeRange(n.sizes_mm)}`,
  };
};

// 프로젝트 상세 > 뜨개 정보 > 실/바늘: 서랍장에서 연결한 항목
const ProjectDrawerLinks = ({
  kind,
  label,
  items,
  editable,
  isCreateMode,
  projectId,
  onChangeSelection,
  onChangeUsage,
}: Props) => {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [myItems, setMyItems] = useState<DrawerItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [infoItem, setInfoItem] = useState<DrawerItem | null>(null);

  // ── 실 사용량 입력
  const [usageTarget, setUsageTarget] = useState<ProjectLinkedYarn | null>(
    null,
  );
  const [usageUnit, setUsageUnit] = useState<'g' | 'ball'>('g');
  const [usageInput, setUsageInput] = useState('');
  const [usageSaving, setUsageSaving] = useState(false);
  const [usageTags, setUsageTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const openUsage = (yarn: ProjectLinkedYarn) => {
    setUsageTarget(yarn);
    setUsageUnit('g');
    setUsageInput(
      yarn.used_grams != null ? String(Number(yarn.used_grams)) : '',
    );
    setUsageTags(yarn.purpose_tags ?? []);
    setAddingTag(false);
    setNewTag('');
  };

  // 기본 태그 + 이 실에 직접 만든 태그 (직접 만든 태그는 이 프로젝트의 이 실에만 저장됨)
  const tagOptions = [
    ...DEFAULT_PURPOSE_TAGS,
    ...usageTags.filter(t => !DEFAULT_PURPOSE_TAGS.includes(t)),
  ];

  const toggleUsageTag = (tag: string) =>
    setUsageTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );

  const submitNewTag = () => {
    const tag = newTag.trim();
    if (tag && !usageTags.includes(tag)) setUsageTags(prev => [...prev, tag]);
    setNewTag('');
    setAddingTag(false);
  };

  // 볼 단위 입력은 볼당 중량으로 g 환산해서 저장
  const usageGrams = (() => {
    const n = parseFloat(usageInput);
    if (!Number.isFinite(n) || n <= 0) return null;
    const grams =
      usageUnit === 'ball' ? n * Number(usageTarget?.grams_per_ball ?? 0) : n;
    return grams > 0 ? Math.round(grams * 10) / 10 : null;
  })();

  // 사용량은 비워둬도 됨(용도만 저장 가능). 입력했으면 올바른 숫자여야 함
  const canSaveUsage =
    !usageSaving && (usageInput.trim() === '' || usageGrams != null);

  const saveUsage = async () => {
    if (!usageTarget || !onChangeUsage || !canSaveUsage) return;
    setUsageSaving(true);
    try {
      await onChangeUsage(usageTarget.id, {
        usedGrams: usageGrams,
        purposeTags: usageTags,
      });
      setUsageTarget(null);
    } catch (e) {
      console.error('실 사용량 저장 실패:', e);
      Alert.alert('오류', '사용량 저장에 실패했어요.');
    } finally {
      setUsageSaving(false);
    }
  };

  const openPicker = async () => {
    if (!user?.id) return;
    setSelectedIds(items.map(i => i.id));
    setPickerVisible(true);
    setPickerLoading(true);
    try {
      setMyItems(
        kind === 'yarn'
          ? await fetchMyYarns(user.id)
          : await fetchMyNeedles(user.id),
      );
    } catch (e) {
      console.error(`서랍장 ${LABEL[kind]} 목록 조회 실패:`, e);
    } finally {
      setPickerLoading(false);
    }
  };

  const toggle = (id: string) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id],
    );

  const applySelection = async () => {
    setApplying(true);
    try {
      await onChangeSelection(
        selectedIds,
        myItems.filter(i => selectedIds.includes(i.id)),
      );
      setPickerVisible(false);
    } catch (e) {
      console.error(`프로젝트 ${LABEL[kind]} 연결 실패:`, e);
      Alert.alert('오류', `${LABEL[kind]} 연결에 실패했어요.`);
    } finally {
      setApplying(false);
    }
  };

  // 서랍에 새로 추가 → 저장되면 이 프로젝트에 자동 연결되고 프로젝트로 돌아옴
  const goAdd = (route: string) => {
    setPickerVisible(false);
    navigation.navigate(route, {linkProjectId: projectId});
  };

  const handlePressItem = (item: DrawerItem) => {
    // 내 실/바늘은 서랍장 상세로, 다른 사람 것은 공개 정보 시트로
    if (editable) {
      navigation.navigate(
        kind === 'yarn'
          ? DRAWER_ROUTES.YARN_DETAIL
          : DRAWER_ROUTES.NEEDLE_DETAIL,
        kind === 'yarn' ? {yarnId: item.id} : {needleId: item.id},
      );
    } else {
      setInfoItem(item);
    }
  };

  const renderThumb = (image: string | null, size: number) =>
    image ? (
      <Thumb source={{uri: image}} style={{width: size, height: size}} />
    ) : (
      <ThumbPlaceholder style={{width: size, height: size}}>
        <Icon name="image" size={14} color="#ccc" />
      </ThumbPlaceholder>
    );

  const renderInfoSheet = () => {
    if (!infoItem) return null;
    const d = toDisplay(kind, infoItem);
    // 실은 색상/LOT가 아래 표에 들어가므로 헤더에는 브랜드만
    const headerSub =
      kind === 'yarn' ? (infoItem as PublicUserYarn).brand : d.sub;
    // 다른 사람 프로젝트에서만 열리는 시트 — 구매 정보는 작성자 전용이라 표시하지 않음 (RPC에서도 빠져서 옴)
    const {spec} =
      kind === 'yarn'
        ? yarnInfoRows(infoItem as PublicUserYarn)
        : needleInfoRows(infoItem as PublicUserNeedle);
    const extra: InfoRow[] = [];
    if (kind === 'yarn') {
      const y = infoItem as ProjectLinkedYarn;
      if (y.purpose_tags?.length)
        extra.push(['용도', y.purpose_tags.join(', ')]);
      if (y.used_grams != null)
        extra.push([
          '사용량',
          formatGramsWithBalls(y.used_grams, y.grams_per_ball),
        ]);
    }
    const rows = [...spec, ...extra].filter(([, v]) => !!v);
    return (
      <ScrollView
        style={{maxHeight: 480}}
        contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 12}}>
        <InfoHeader>
          {renderThumb(d.image, 64)}
          <View style={{flex: 1}}>
            <ItemTitle numberOfLines={2}>{d.title}</ItemTitle>
            {!!headerSub && <ItemSub numberOfLines={2}>{headerSub}</ItemSub>}
          </View>
        </InfoHeader>
        {rows.map(([label, value]) => (
          <SheetRow key={label}>
            <SheetLabel>{label}</SheetLabel>
            <SheetValue>{value}</SheetValue>
          </SheetRow>
        ))}
      </ScrollView>
    );
  };

  return (
    <>
      <HeaderRow>
        {label}
        {editable && (
          <PickButton onPress={openPicker}>
            <Icon name="archive" size={13} color="#555" />
            <PickButtonText>서랍에서 고르기</PickButtonText>
          </PickButton>
        )}
      </HeaderRow>

      {items.map(item => {
        const d = toDisplay(kind, item);
        const yarn = kind === 'yarn' ? (item as ProjectLinkedYarn) : null;
        // "메인 · 125g (2.5볼)"
        const usage = yarn
          ? formatYarnUsage(yarn, yarn.grams_per_ball) || null
          : null;
        return (
          <LinkedCard
            key={item.id}
            onPress={() => handlePressItem(item)}
            activeOpacity={0.7}>
            {/* 서랍장에서 고른 항목 표시 — 직접 입력 카드는 ✎ 아이콘 */}
            <Icon name="archive" size={13} color="#bbb" />
            <View style={{flex: 1}}>
              <ItemTitle numberOfLines={1}>{d.title}</ItemTitle>
              {/* 프로젝트 상세에선 간단히: 실은 색상만(있을 때), 바늘은 이름만 */}
              {!!yarn?.color && (
                <ItemSub numberOfLines={1}>{yarn.color}</ItemSub>
              )}
            </View>
            {yarn &&
              (editable && onChangeUsage ? (
                <UsageButton onPress={() => openUsage(yarn)} hitSlop={8}>
                  <UsageText muted={!usage}>{usage ?? '용도·사용량'}</UsageText>
                  <Icon name="edit-2" size={11} color="#bbb" />
                </UsageButton>
              ) : (
                !!usage && <UsageText>{usage}</UsageText>
              ))}
            <Icon name="chevron-right" size={16} color="#ccc" />
          </LinkedCard>
        );
      })}

      {/* 서랍에서 고르기 */}
      <ActionSheetModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}>
        <SheetTitle>{LABEL[kind]} 서랍에서 고르기</SheetTitle>

        {isCreateMode ? (
          <SheetHint>
            서랍에 새로 추가하기는 프로젝트를 저장한 뒤에 할 수 있어요.
          </SheetHint>
        ) : (
          <AddRow>
            {kind === 'yarn' ? (
              <>
                <AddChip
                  onPress={() => goAdd(DRAWER_ROUTES.YARN_RAVELRY_SEARCH)}>
                  <Icon name="plus" size={13} color="#555" />
                  <AddChipText>Ravelry 에서 가져오기</AddChipText>
                </AddChip>
                <AddChip onPress={() => goAdd(DRAWER_ROUTES.YARN_FORM)}>
                  <Icon name="plus" size={13} color="#555" />
                  <AddChipText>직접 입력으로 추가</AddChipText>
                </AddChip>
              </>
            ) : (
              <AddChip onPress={() => goAdd(DRAWER_ROUTES.NEEDLE_FORM)}>
                <Icon name="plus" size={13} color="#555" />
                <AddChipText>서랍에 새 바늘 추가</AddChipText>
              </AddChip>
            )}
          </AddRow>
        )}

        {pickerLoading ? (
          <View style={{paddingVertical: 32}}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        ) : myItems.length === 0 ? (
          <SheetHint style={{textAlign: 'center', paddingVertical: 24}}>
            서랍장에 등록된 {LABEL[kind]}이 없어요.
          </SheetHint>
        ) : (
          <ScrollView
            style={{maxHeight: 360}}
            contentContainerStyle={{paddingHorizontal: 20}}>
            {myItems.map(item => {
              const d = toDisplay(kind, item);
              const selected = selectedIds.includes(item.id);
              return (
                <ItemRow
                  key={item.id}
                  onPress={() => toggle(item.id)}
                  activeOpacity={0.7}>
                  {renderThumb(d.image, 36)}
                  <View style={{flex: 1}}>
                    <ItemTitle numberOfLines={1}>{d.title}</ItemTitle>
                    {!!d.sub && <ItemSub numberOfLines={1}>{d.sub}</ItemSub>}
                  </View>
                  <SelectCircle selected={selected}>
                    {selected && <Icon name="check" size={13} color="#fff" />}
                  </SelectCircle>
                </ItemRow>
              );
            })}
          </ScrollView>
        )}

        <ConfirmButton
          disabled={applying || pickerLoading}
          onPress={applySelection}>
          {applying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ConfirmText>선택 완료</ConfirmText>
          )}
        </ConfirmButton>
      </ActionSheetModal>

      {/* 실 사용량 입력 */}
      <KeyboardSheet
        visible={!!usageTarget}
        onClose={() => setUsageTarget(null)}>
        <DialogTitle numberOfLines={1}>{usageTarget?.name}</DialogTitle>

        <DialogLabel>용도</DialogLabel>
        <TagWrap>
          {tagOptions.map(tag => {
            const active = usageTags.includes(tag);
            return (
              <UnitChip
                key={tag}
                active={active}
                onPress={() => toggleUsageTag(tag)}>
                <UnitChipText active={active}>{tag}</UnitChipText>
              </UnitChip>
            );
          })}
          {addingTag ? (
            <NewTagInput
              autoFocus
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={submitNewTag}
              onBlur={submitNewTag}
              placeholder="태그 입력"
              placeholderTextColor="#bbb"
              maxLength={10}
              returnKeyType="done"
            />
          ) : (
            <UnitChip active={false} onPress={() => setAddingTag(true)}>
              <UnitChipText active={false}>+ 추가</UnitChipText>
            </UnitChip>
          )}
        </TagWrap>

        <DialogLabel>사용량</DialogLabel>
        <UnitRow>
          {(['g', 'ball'] as const).map(u => {
            const disabled = u === 'ball' && !usageTarget?.grams_per_ball;
            const active = usageUnit === u;
            return (
              <UnitChip
                key={u}
                active={active}
                disabled={disabled}
                onPress={() => {
                  setUsageUnit(u);
                  setUsageInput('');
                }}>
                <UnitChipText active={active} disabled={disabled}>
                  {u === 'g' ? 'g' : '볼'}
                </UnitChipText>
              </UnitChip>
            );
          })}
        </UnitRow>
        <UsageInputRow>
          <UsageInput
            value={usageInput}
            onChangeText={v => setUsageInput(v.replace(/[^0-9.]/g, ''))}
            placeholder={usageUnit === 'g' ? '예: 125' : '예: 2.5'}
            placeholderTextColor="#bbb"
            keyboardType="decimal-pad"
            maxLength={7}
          />
          <UsageUnitLabel>{usageUnit === 'g' ? 'g' : '볼'}</UsageUnitLabel>
        </UsageInputRow>
        <DialogHint>
          {usageUnit === 'ball' && usageGrams != null
            ? `${usageGrams}g으로 저장돼요.`
            : !usageTarget?.grams_per_ball
            ? '볼당 중량이 없어서 g으로만 입력할 수 있어요.'
            : '사용량은 서랍장의 남은 양 계산에 쓰여요. 비워둬도 돼요.'}
        </DialogHint>
        <DialogButtons>
          <DialogButton
            disabled={usageSaving}
            onPress={() => setUsageTarget(null)}>
            <DialogButtonText>취소</DialogButtonText>
          </DialogButton>
          <DialogButton primary disabled={!canSaveUsage} onPress={saveUsage}>
            {usageSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <DialogButtonText primary>저장</DialogButtonText>
            )}
          </DialogButton>
        </DialogButtons>
      </KeyboardSheet>

      {/* 다른 사람 프로젝트: 공개 정보 보기 (메모·구매 정보 제외) */}
      <ActionSheetModal visible={!!infoItem} onClose={() => setInfoItem(null)}>
        {renderInfoSheet()}
      </ActionSheetModal>
    </>
  );
};

export default ProjectDrawerLinks;

const ItemRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
`;

// 서랍장에서 연결한 실/바늘 — 카드로 감싸서 직접 입력한 텍스트와 같은 모양, 왼쪽 아이콘(🗄)으로 구분
const LinkedCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border-width: 1px;
  border-color: #ebebeb;
  background-color: #fafafa;
`;

const Thumb = styled(FastImage)`
  border-radius: 8px;
  background-color: #f5f5f5;
`;

const ThumbPlaceholder = styled.View`
  border-radius: 8px;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

const ItemTitle = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const ItemSub = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 2px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
`;

const PickButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  background-color: #f5f5f5;
`;

const PickButtonText = styled.Text`
  font-size: 12px;
  color: #555;
`;

const SheetTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #191919;
  padding: 8px 20px 12px;
`;

const SheetHint = styled.Text`
  font-size: 13px;
  color: #999;
  padding: 0 20px 12px;
`;

const AddRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 12px;
`;

const AddChip = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  border-radius: 16px;
  border-width: 1px;
  border-color: #e5e5e5;
`;

const AddChipText = styled.Text`
  font-size: 13px;
  color: #555;
`;

const SelectCircle = styled.View<{selected: boolean}>`
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border-width: ${({selected}) => (selected ? '0px' : '1.5px')};
  border-color: #ddd;
  background-color: ${({selected}) => (selected ? '#191919' : '#fff')};
  align-items: center;
  justify-content: center;
`;

const ConfirmButton = styled.TouchableOpacity`
  margin: 12px 20px 4px;
  height: 48px;
  border-radius: 12px;
  background-color: ${({disabled}) => (disabled ? '#ccc' : '#191919')};
  align-items: center;
  justify-content: center;
`;

const ConfirmText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

const InfoHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 8px 0 12px;
`;

const SheetRow = styled.View`
  flex-direction: row;
  padding: 10px 0;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

const SheetLabel = styled.Text`
  width: 84px;
  font-size: 14px;
  color: #999;
`;

const SheetValue = styled.Text`
  flex: 1;
  font-size: 14px;
  color: #191919;
`;

const UsageButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const UsageText = styled.Text<{muted?: boolean}>`
  font-size: 13px;
  color: ${({muted}) => (muted ? '#bbb' : '#555')};
`;

const DialogTitle = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #191919;
  margin-bottom: 14px;
`;

const UnitRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-bottom: 12px;
`;

const UnitChip = styled.TouchableOpacity<{active: boolean}>`
  padding: 6px 16px;
  border-radius: 14px;
  background-color: ${({active}) => (active ? '#191919' : '#f5f5f5')};
`;

const UnitChipText = styled.Text<{active: boolean; disabled?: boolean}>`
  font-size: 13px;
  font-weight: 500;
  color: ${({active, disabled}) =>
    active ? '#fff' : disabled ? '#ccc' : '#555'};
`;

const UsageInputRow = styled.View`
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #e5e5e5;
`;

const UsageInput = styled.TextInput`
  flex: 1;
  font-size: 18px;
  color: #191919;
  padding: 8px 0;
`;

const UsageUnitLabel = styled.Text`
  font-size: 15px;
  color: #999;
`;

const DialogHint = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
`;

const DialogButtons = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

const DialogButton = styled.TouchableOpacity<{primary?: boolean}>`
  flex: 1;
  height: 48px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  background-color: ${({primary, disabled}) =>
    primary ? (disabled ? '#ccc' : '#191919') : '#f5f5f5'};
`;

const DialogButtonText = styled.Text<{
  primary?: boolean;
  destructive?: boolean;
}>`
  font-size: 15px;
  font-weight: 600;
  color: ${({primary, destructive}) =>
    primary ? '#fff' : destructive ? '#ff3b30' : '#555'};
`;

const DialogLabel = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
`;

const TagWrap = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
`;

const NewTagInput = styled.TextInput`
  min-width: 72px;
  padding: 5px 12px;
  border-radius: 14px;
  border-width: 1px;
  border-color: #ddd;
  font-size: 13px;
  color: #191919;
`;
