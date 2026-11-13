import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, View} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {launchImageLibrary} from 'react-native-image-picker';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import KeyboardAvoid from '@/components/common/KeyboardAvoid';
import ActionSheetModal, {ActionSheetAction} from '@/components/modal/ActionSheetModal';
import CalendarModal from '@/components/modal/CalendarModal';
import {DrawerStackParamList} from '@/@types/navigation';
import {DRAWER_ROUTES} from '@/constants/navigation.constant';
import {NeedleCategory, NeedleType, ProjectBase} from '@/@types/database';
import {
  CABLE_LENGTH_CHIPS_CM,
  EMPTY_NEEDLE_FORM,
  NEEDLE_CATEGORIES,
  NEEDLE_TYPES,
  NeedleFormValues,
  SIZE_CHIPS_MM,
  SIZE_CONVERSIONS,
  fetchNeedle,
  hasCableLength,
  needleAutoName,
  needleToForm,
  saveNeedle,
} from '@/lib/userNeedles';
import * as S from './YarnForm.style';

type ArrayKey = 'sizesMm' | 'cableLengthsCm';
type ProjectOption = Pick<ProjectBase, 'id' | 'title' | 'thumbnail_url' | 'status'>;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (date: string) => date.replace(/-/g, '.');

// 서랍장 > 바늘 추가/수정 폼 (직접 입력만)
// - 단품: 호수/케이블 길이를 하나씩 선택
// - 세트: 여러 개 선택
const NeedleFormScreen = () => {
  const route = useRoute<RouteProp<DrawerStackParamList, typeof DRAWER_ROUTES.NEEDLE_FORM>>();
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const needleId = route.params?.needleId;
  const isEdit = !!needleId;
  const linkProjectId = route.params?.linkProjectId;

  const [form, setForm] = useState<NeedleFormValues>(EMPTY_NEEDLE_FORM);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [projectIds, setProjectIds] = useState<string[]>(linkProjectId ? [linkProjectId] : []);
  const [previousProjectIds, setPreviousProjectIds] = useState<string[]>([]);
  const [myProjects, setMyProjects] = useState<ProjectOption[]>([]);
  const [projectSheetVisible, setProjectSheetVisible] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [imageSheetVisible, setImageSheetVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [tipTab, setTipTab] = useState<'ho' | 'us'>('ho');
  // 직접 입력 중인 칩 그룹
  const [customInput, setCustomInput] = useState<{key: ArrayKey; value: string} | null>(null);

  useEffect(() => {
    navigation.setOptions({title: isEdit ? '바늘 수정' : '바늘 추가'});
  }, [navigation, isEdit]);

  useEffect(() => {
    if (!needleId) return;
    (async () => {
      try {
        const needle = await fetchNeedle(needleId);
        const ids = needle.projects.map(p => p.id);
        setForm(needleToForm(needle));
        setPreviousImageUrl(needle.image_url);
        setProjectIds(ids);
        setPreviousProjectIds(ids);
      } catch (e) {
        console.error('바늘 정보 조회 실패:', e);
        Alert.alert('오류', '바늘 정보를 불러오지 못했어요.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [needleId, navigation]);

  // 연결할 내 프로젝트 목록
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('projects')
      .select('id, title, thumbnail_url, status')
      .eq('user_id', user.id)
      .order('created_at', {ascending: false})
      .then(({data, error}) => {
        if (error) console.error('프로젝트 목록 조회 실패:', error);
        else setMyProjects(data ?? []);
      });
  }, [user?.id]);

  const toggleProject = (id: string) =>
    setProjectIds(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));

  const linkedProjects = myProjects.filter(p => projectIds.includes(p.id));

  const setField = <K extends keyof NeedleFormValues>(key: K, value: NeedleFormValues[K]) =>
    setForm(prev => ({...prev, [key]: value}));

  // ── 종류 / 모양 / 구성
  const selectCategory = (category: NeedleCategory) => {
    if (form.category === category) return;
    // 종류가 바뀌면 모양은 다시 고르게 함 (호수 mm는 그대로 유지)
    setForm(prev => ({...prev, category, needleType: null, cableLengthsCm: []}));
  };

  const selectType = (needleType: NeedleType) =>
    setForm(prev => ({
      ...prev,
      needleType,
      cableLengthsCm: hasCableLength(needleType) ? prev.cableLengthsCm : [],
    }));

  const selectIsSet = (isSet: boolean) =>
    setForm(prev =>
      isSet
        ? {...prev, isSet}
        : {
            // 단품으로 바꾸면 첫 번째 값만 남김
            ...prev,
            isSet,
            sizesMm: prev.sizesMm.slice(0, 1),
            cableLengthsCm: prev.cableLengthsCm.slice(0, 1),
          },
    );

  // 단품: 하나만 선택(같은 값 다시 누르면 해제) / 세트: 여러 개 토글
  const toggleValue = (key: ArrayKey, value: number) =>
    setForm(prev => {
      const current = prev[key];
      const exists = current.includes(value);
      let next: number[];
      if (prev.isSet) next = exists ? current.filter(v => v !== value) : [...current, value];
      else next = exists ? [] : [value];
      return {...prev, [key]: next.sort((a, b) => a - b)};
    });

  const submitCustom = () => {
    if (!customInput) return;
    const {key, value} = customInput;
    const isMm = key === 'sizesMm';
    const n = isMm ? Math.round(parseFloat(value) * 100) / 100 : parseInt(value, 10);
    const valid = isMm ? n > 0 && n < 100 : n > 0 && n < 1000;
    if (Number.isFinite(n) && valid && !form[key].includes(n)) toggleValue(key, n);
    setCustomInput(null);
  };

  const sizeTip = form.category ? SIZE_CONVERSIONS[form.category] : SIZE_CONVERSIONS.knitting;

  const autoName = useMemo(
    () =>
      form.needleType && form.sizesMm.length > 0
        ? needleAutoName({
            brand: form.brand,
            needle_type: form.needleType,
            is_set: form.isSet,
            sizes_mm: form.sizesMm,
            cable_lengths_cm: hasCableLength(form.needleType) ? form.cableLengthsCm : [],
          })
        : '',
    [form],
  );

  // ── 사진
  const pickImage = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    const uri = result.assets?.[0]?.uri;
    if (uri) setField('imageUrl', uri);
  };

  const imageActions: ActionSheetAction[] = [
    {label: '앨범에서 선택', onPress: pickImage},
    ...(form.imageUrl
      ? [{label: '사진 삭제', isDestructive: true, onPress: () => setField('imageUrl', null)}]
      : []),
  ];

  // ── 저장
  const canSave = !!form.category && !!form.needleType && form.sizesMm.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    if (!user?.id) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }
    setSaving(true);
    try {
      const savedId = await saveNeedle({
        userId: user.id,
        needleId,
        form,
        previousImageUrl,
        projectIds,
        previousProjectIds,
      });
      if (isEdit || linkProjectId) {
        // 수정, 또는 프로젝트 상세에서 들어온 경우엔 이전 화면으로 복귀
        navigation.goBack();
      } else {
        navigation.popToTop();
        navigation.navigate(DRAWER_ROUTES.NEEDLE_DETAIL, {needleId: savedId});
      }
    } catch (e) {
      console.error('바늘 저장 실패:', e);
      Alert.alert('오류', e instanceof Error ? e.message : '바늘 저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <S.Center>
        <ActivityIndicator size="large" color="#999" />
      </S.Center>
    );
  }

  // 숫자 칩 그룹: 기본 칩 + 직접 입력한 값 + "직접 입력"
  const renderNumberChips = (key: ArrayKey, defaults: number[], unit: string) => {
    const options = Array.from(new Set([...defaults, ...form[key]])).sort((a, b) => a - b);
    const isMm = key === 'sizesMm';
    return (
      <S.TagWrap>
        {options.map(v => {
          const active = form[key].includes(v);
          return (
            <S.Tag key={v} active={active} onPress={() => toggleValue(key, v)}>
              <S.TagText active={active}>
                {v}
                {unit}
              </S.TagText>
            </S.Tag>
          );
        })}
        {customInput?.key === key ? (
          <S.TagInput
            autoFocus
            value={customInput.value}
            onChangeText={v =>
              setCustomInput({key, value: isMm ? v.replace(/[^0-9.]/g, '') : v.replace(/[^0-9]/g, '')})
            }
            onSubmitEditing={submitCustom}
            onBlur={submitCustom}
            placeholder={unit}
            placeholderTextColor="#bbb"
            keyboardType={isMm ? 'decimal-pad' : 'number-pad'}
            maxLength={5}
            returnKeyType="done"
          />
        ) : (
          <S.Tag onPress={() => setCustomInput({key, value: ''})}>
            <Icon name="plus" size={13} color="#555" />
            <S.TagText>직접 입력</S.TagText>
          </S.Tag>
        )}
      </S.TagWrap>
    );
  };

  const renderTextField = (
    label: string,
    key: 'name' | 'brand' | 'purchasePlace' | 'price',
    placeholder: string,
    options: {unit?: string; numeric?: boolean; maxLength?: number} = {},
  ) => (
    <S.FieldRow>
      <S.FieldLabel>{label}</S.FieldLabel>
      <S.FieldInput
        value={form[key]}
        onChangeText={v => setField(key, options.numeric ? v.replace(/[^0-9]/g, '') : v)}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        keyboardType={options.numeric ? 'number-pad' : 'default'}
        maxLength={options.maxLength ?? 100}
      />
      {options.unit && <S.FieldUnit>{options.unit}</S.FieldUnit>}
    </S.FieldRow>
  );

  return (
    <S.Container>
      <KeyboardAvoid>
        {/* 이미지 */}
        <S.ImageArea>
          <S.ImageButton onPress={() => setImageSheetVisible(true)} activeOpacity={0.8}>
            {form.imageUrl ? (
              <S.Image source={{uri: form.imageUrl}} />
            ) : (
              <Icon name="camera" size={28} color="#ccc" />
            )}
            <S.ImageBadge>
              <Icon name="edit-2" size={13} color="#fff" />
            </S.ImageBadge>
          </S.ImageButton>
          <S.ImageHint>{form.imageUrl ? '탭해서 사진을 바꿀 수 있어요' : '탭해서 사진을 추가하세요'}</S.ImageHint>
        </S.ImageArea>

        {/* 종류 / 모양 / 구성 */}
        <S.Section>
          <S.SectionTitle>
            종류<S.Required> *</S.Required>
          </S.SectionTitle>
          <S.TagWrap>
            {NEEDLE_CATEGORIES.map(c => {
              const active = form.category === c.value;
              return (
                <S.Tag key={c.value} active={active} onPress={() => selectCategory(c.value)}>
                  <S.TagText active={active}>{c.label}</S.TagText>
                </S.Tag>
              );
            })}
          </S.TagWrap>

          {form.category && (
            <>
              <S.GroupLabel>
                모양<S.Required> *</S.Required>
              </S.GroupLabel>
              <S.TagWrap>
                {NEEDLE_TYPES[form.category].map(t => {
                  const active = form.needleType === t.value;
                  return (
                    <S.Tag key={t.value} active={active} onPress={() => selectType(t.value)}>
                      <S.TagText active={active}>{t.label}</S.TagText>
                    </S.Tag>
                  );
                })}
              </S.TagWrap>
            </>
          )}

          <S.GroupLabel>구성</S.GroupLabel>
          <S.TagWrap>
            {[
              {value: false, label: '단품'},
              {value: true, label: '세트'},
            ].map(o => {
              const active = form.isSet === o.value;
              return (
                <S.Tag key={o.label} active={active} onPress={() => selectIsSet(o.value)}>
                  <S.TagText active={active}>{o.label}</S.TagText>
                </S.Tag>
              );
            })}
          </S.TagWrap>
        </S.Section>

        {/* 호수 / 길이 */}
        <S.Section>
          <S.SectionTitleRow>
            <S.SectionTitle>
              호수 (mm)<S.Required> *</S.Required>
            </S.SectionTitle>
            <S.TipButton onPress={() => setTipVisible(true)}>
              <Icon name="info" size={13} color="#555" />
              <S.TipText>호수 → mm 변환</S.TipText>
            </S.TipButton>
          </S.SectionTitleRow>
          {form.category ? (
            <>
              {form.isSet && <S.FieldHint>세트에 들어 있는 호수를 모두 선택해주세요.</S.FieldHint>}
              {renderNumberChips('sizesMm', SIZE_CHIPS_MM[form.category], 'mm')}
            </>
          ) : (
            <S.FieldHint>종류를 먼저 선택해주세요.</S.FieldHint>
          )}

          {hasCableLength(form.needleType) && (
            <>
              <S.GroupLabel>케이블 길이</S.GroupLabel>
              {renderNumberChips('cableLengthsCm', CABLE_LENGTH_CHIPS_CM, 'cm')}
            </>
          )}
        </S.Section>

        {/* 기본 정보 */}
        <S.Section>
          <S.SectionTitle>기본 정보</S.SectionTitle>
          {renderTextField('이름', 'name', autoName || '비워두면 자동으로 만들어져요')}
          {renderTextField('브랜드', 'brand', '브랜드')}
          {!form.name.trim() && !!autoName && (
            <S.FieldHint>이름을 비워두면 “{autoName}”(으)로 보여요.</S.FieldHint>
          )}
        </S.Section>

        {/* 구매 정보 + 메모 (나만 볼 수 있음) */}
        <S.Section>
          <S.SectionTitleInline>
            <S.SectionTitle style={{marginBottom: 0}}>구매 정보</S.SectionTitle>
            <S.PrivateBadge>
              <Icon name="lock" size={11} color="#999" />
              <S.PrivateBadgeText>나만 볼 수 있어요.</S.PrivateBadgeText>
            </S.PrivateBadge>
          </S.SectionTitleInline>
          {renderTextField('구매처', 'purchasePlace', '구매처')}
          <S.FieldRow>
            <S.FieldLabel>구매일</S.FieldLabel>
            <S.FieldPressable onPress={() => setCalendarVisible(true)}>
              <S.FieldValue placeholder={!form.purchasedAt}>
                {form.purchasedAt ? formatDate(form.purchasedAt) : '날짜 선택'}
              </S.FieldValue>
              {form.purchasedAt ? (
                <Icon name="x" size={16} color="#bbb" onPress={() => setField('purchasedAt', null)} />
              ) : (
                <Icon name="calendar" size={16} color="#bbb" />
              )}
            </S.FieldPressable>
          </S.FieldRow>
          {renderTextField('가격', 'price', '가격', {unit: '원', numeric: true, maxLength: 9})}
          <S.GroupLabel>메모</S.GroupLabel>
          <S.MemoInput
            value={form.memo}
            onChangeText={v => setField('memo', v)}
            placeholder="자유롭게 메모를 남겨보세요."
            placeholderTextColor="#bbb"
            multiline
            maxLength={1000}
          />
        </S.Section>

        {/* 연결된 프로젝트 */}
        <S.Section style={{borderBottomWidth: 0}}>
          <S.SectionTitle>연결된 프로젝트</S.SectionTitle>
          {linkedProjects.map(p => (
            <S.ProjectRow key={p.id} onPress={() => toggleProject(p.id)}>
              {p.thumbnail_url ? (
                <S.ProjectThumb source={{uri: p.thumbnail_url}} />
              ) : (
                <S.ProjectThumbPlaceholder>
                  <Icon name="folder" size={16} color="#ccc" />
                </S.ProjectThumbPlaceholder>
              )}
              <S.ProjectTitle numberOfLines={1}>{p.title}</S.ProjectTitle>
              <Icon name="x" size={16} color="#bbb" />
            </S.ProjectRow>
          ))}
          <S.AddLinkButton onPress={() => setProjectSheetVisible(true)}>
            <Icon name="link" size={14} color="#555" />
            <S.AddLinkText>프로젝트 연결하기</S.AddLinkText>
          </S.AddLinkButton>
        </S.Section>

      </KeyboardAvoid>

      <S.BottomBar>
        <S.SaveButton disabled={!canSave} onPress={handleSave}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <S.SaveButtonText>{isEdit ? '수정 완료' : '서랍장에 저장'}</S.SaveButtonText>
          )}
        </S.SaveButton>
      </S.BottomBar>

      <ActionSheetModal
        visible={imageSheetVisible}
        onClose={() => setImageSheetVisible(false)}
        actions={imageActions}
      />

      <ActionSheetModal
        visible={projectSheetVisible}
        onClose={() => setProjectSheetVisible(false)}>
        <S.SheetTitle>프로젝트 연결</S.SheetTitle>
        {myProjects.length === 0 ? (
          <S.SheetEmpty>연결할 프로젝트가 없어요.</S.SheetEmpty>
        ) : (
          <ScrollView style={{maxHeight: 360}} contentContainerStyle={{paddingHorizontal: 20}}>
            {myProjects.map(p => {
              const selected = projectIds.includes(p.id);
              return (
                <S.ProjectRow key={p.id} onPress={() => toggleProject(p.id)}>
                  {p.thumbnail_url ? (
                    <S.ProjectThumb source={{uri: p.thumbnail_url}} />
                  ) : (
                    <S.ProjectThumbPlaceholder>
                      <Icon name="folder" size={16} color="#ccc" />
                    </S.ProjectThumbPlaceholder>
                  )}
                  <S.ProjectTitle numberOfLines={1}>{p.title}</S.ProjectTitle>
                  <S.SelectCircle selected={selected}>
                    {selected && <Icon name="check" size={13} color="#fff" />}
                  </S.SelectCircle>
                </S.ProjectRow>
              );
            })}
            <View style={{height: 8}} />
          </ScrollView>
        )}
      </ActionSheetModal>

      {/* 호수 → mm 변환표: 옷 사이즈표처럼 참고용 (선택 기능 없음) */}
      <ActionSheetModal visible={tipVisible} onClose={() => setTipVisible(false)}>
        <S.SheetTitle>
          {form.category === 'crochet' ? '코바늘' : '대바늘'} 호수 → mm 변환표
        </S.SheetTitle>
        <S.ConvertTabs>
          {[
            {value: 'ho' as const, label: '호수 (국내/일본)'},
            {value: 'us' as const, label: 'US 사이즈'},
          ].map(t => {
            const active = tipTab === t.value;
            return (
              <S.Tag key={t.value} active={active} onPress={() => setTipTab(t.value)}>
                <S.TagText active={active}>{t.label}</S.TagText>
              </S.Tag>
            );
          })}
        </S.ConvertTabs>
        <S.ConvertTable>
          <S.ConvertRow header>
            <S.ConvertCell header>{tipTab === 'ho' ? '호수' : 'US'}</S.ConvertCell>
            <S.ConvertCell header last>
              mm
            </S.ConvertCell>
          </S.ConvertRow>
          <ScrollView style={{maxHeight: 340}}>
            {sizeTip[tipTab].map((row, i) => (
              <S.ConvertRow key={row.label} even={i % 2 === 1}>
                <S.ConvertCell>{row.label}</S.ConvertCell>
                <S.ConvertCell last>{row.mm}</S.ConvertCell>
              </S.ConvertRow>
            ))}
          </ScrollView>
        </S.ConvertTable>
        <S.ConvertNote>
          브랜드에 따라 조금씩 다를 수 있어요. 바늘이나 포장에 mm가 적혀 있으면 그 값을 우선 사용해주세요.
        </S.ConvertNote>
      </ActionSheetModal>

      <CalendarModal
        visible={calendarVisible}
        mode="single"
        title="구매일"
        initialDate={form.purchasedAt ?? undefined}
        maxDate={todayStr()}
        onConfirm={({date}) => {
          if (date) setField('purchasedAt', date);
          setCalendarVisible(false);
        }}
        onClose={() => setCalendarVisible(false)}
      />
    </S.Container>
  );
};

export default NeedleFormScreen;
