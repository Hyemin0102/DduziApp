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
import {ProjectBase} from '@/@types/database';
import {EMPTY_YARN_FORM, YarnFormValues, fetchColorways} from '@/lib/ravelryYarn';
import {fetchYarn, saveYarn, yarnToForm} from '@/lib/userYarns';
import * as S from './YarnForm.style';

type ProjectOption = Pick<ProjectBase, 'id' | 'title' | 'thumbnail_url' | 'status'>;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (date: string) => date.replace(/-/g, '.');

// 서랍장 > 실 추가/수정 폼
// - 레이블리에서 가져오기: prefill로 이름/브랜드/합수/성분/게이지/바늘/볼당 중량·길이/사진이 채워져서 들어옴
// - 직접 입력: 빈 폼
// - 수정: yarnId로 기존 값 로드
const YarnFormScreen = () => {
  const route = useRoute<RouteProp<DrawerStackParamList, typeof DRAWER_ROUTES.YARN_FORM>>();
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const yarnId = route.params?.yarnId;
  const isEdit = !!yarnId;
  const linkProjectId = route.params?.linkProjectId;

  const [form, setForm] = useState<YarnFormValues>(route.params?.prefill ?? EMPTY_YARN_FORM);
  const [projectIds, setProjectIds] = useState<string[]>(linkProjectId ? [linkProjectId] : []);
  const [previous, setPrevious] = useState<{customImageUrl: string | null; projectIds: string[]}>({
    customImageUrl: null,
    projectIds: [],
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [myProjects, setMyProjects] = useState<ProjectOption[]>([]);
  const [imageSheetVisible, setImageSheetVisible] = useState(false);
  const [projectSheetVisible, setProjectSheetVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Ravelry에 등록된 색상표가 있을 때만 색상 선택 화면으로 넘어감 (없거나 확인 전엔 직접 입력)
  // 검색 화면에서 받아둔 캐시가 있으면 API 호출 없이 바로 판단
  const [hasColorways, setHasColorways] = useState(false);
  useEffect(() => {
    if (form.ravelryYarnId == null) {
      setHasColorways(false);
      return;
    }
    let active = true;
    fetchColorways(form.ravelryYarnId)
      .then(list => active && setHasColorways(list.length > 0))
      .catch(() => active && setHasColorways(false));
    return () => {
      active = false;
    };
  }, [form.ravelryYarnId]);

  // 색상 선택 화면에서 고른 값 반영
  const pickedColor = route.params?.pickedColor;
  useEffect(() => {
    if (pickedColor) setForm(prev => ({...prev, color: pickedColor.value}));
  }, [pickedColor]);

  useEffect(() => {
    navigation.setOptions({title: isEdit ? '실 수정' : '실 추가'});
  }, [navigation, isEdit]);

  // 수정 모드: 기존 값 로드
  useEffect(() => {
    if (!yarnId) return;
    (async () => {
      try {
        const yarn = await fetchYarn(yarnId);
        const ids = yarn.projects.map(p => p.id);
        setForm(yarnToForm(yarn));
        setProjectIds(ids);
        setPrevious({customImageUrl: yarn.custom_image_url, projectIds: ids});
      } catch (e) {
        console.error('실 정보 조회 실패:', e);
        Alert.alert('오류', '실 정보를 불러오지 못했어요.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [yarnId, navigation]);

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

  const setField = <K extends keyof YarnFormValues>(key: K, value: YarnFormValues[K]) =>
    setForm(prev => ({...prev, [key]: value}));

  // 숫자 입력칸: 정수만 / 소수점 한 자리까지
  const onlyInt = (v: string) => v.replace(/[^0-9]/g, '');
  const onlyDecimal = (v: string) => {
    const cleaned = v.replace(/[^0-9.]/g, '');
    const [int, ...rest] = cleaned.split('.');
    return rest.length ? `${int}.${rest.join('').slice(0, 1)}` : int;
  };

  const totalGrams = useMemo(() => {
    const balls = parseInt(form.ballCount, 10);
    const grams = parseFloat(form.gramsPerBall);
    return balls > 0 && grams > 0 ? Math.round(balls * grams * 10) / 10 : null;
  }, [form.ballCount, form.gramsPerBall]);

  const displayImage = form.customImageUrl || form.ravelryImageUrl;

  // ── 사진
  const pickImage = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    const uri = result.assets?.[0]?.uri;
    if (uri) setField('customImageUrl', uri);
  };

  const imageActions: ActionSheetAction[] = [
    {label: '앨범에서 선택', onPress: pickImage},
    ...(form.customImageUrl && form.ravelryImageUrl
      ? [{label: 'Ravelry 사진으로 되돌리기', onPress: () => setField('customImageUrl', null)}]
      : []),
    ...(form.customImageUrl && !form.ravelryImageUrl
      ? [{label: '사진 삭제', isDestructive: true, onPress: () => setField('customImageUrl', null)}]
      : []),
  ];

  // ── 프로젝트 연결
  const toggleProject = (id: string) =>
    setProjectIds(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));

  const linkedProjects = myProjects.filter(p => projectIds.includes(p.id));

  // ── 저장
  const canSave = form.name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    if (!user?.id) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }
    setSaving(true);
    try {
      const savedId = await saveYarn({
        userId: user.id,
        yarnId,
        form,
        previousCustomImageUrl: previous.customImageUrl,
        projectIds,
        previousProjectIds: previous.projectIds,
      });
      if (isEdit) {
        navigation.goBack();
      } else if (linkProjectId) {
        // 프로젝트 상세에서 들어온 경우: (레이블리 검색 →) 폼을 닫고 프로젝트로 복귀
        navigation.pop(route.params?.fromRavelrySearch ? 2 : 1);
      } else {
        // 레이블리 검색/폼 화면을 걷어내고 서랍장 → 새 실 상세로 이동
        navigation.popToTop();
        navigation.navigate(DRAWER_ROUTES.YARN_DETAIL, {yarnId: savedId});
      }
    } catch (e) {
      console.error('실 저장 실패:', e);
      Alert.alert('오류', e instanceof Error ? e.message : '실 저장에 실패했어요.');
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

  const renderTextField = (
    label: string,
    key: keyof YarnFormValues,
    placeholder: string,
    options: {required?: boolean; unit?: string; keyboard?: 'number-pad' | 'decimal-pad'; maxLength?: number} = {},
  ) => (
    <S.FieldRow>
      <S.FieldLabel>
        {label}
        {options.required && <S.Required> *</S.Required>}
      </S.FieldLabel>
      <S.FieldInput
        value={form[key] as string}
        onChangeText={v =>
          setField(
            key,
            (options.keyboard === 'number-pad'
              ? onlyInt(v)
              : options.keyboard === 'decimal-pad'
              ? onlyDecimal(v)
              : v) as any,
          )
        }
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        keyboardType={options.keyboard ?? 'default'}
        maxLength={options.maxLength ?? 100}
      />
      {options.unit && <S.FieldUnit>{options.unit}</S.FieldUnit>}
    </S.FieldRow>
  );

  return (
    <S.Container>
      <KeyboardAvoid>
        {/* 상단: 실 정보 화면과 같은 레이아웃 — 왼쪽 사진, 오른쪽 브랜드/이름 입력 */}
        <S.FormHeader>
          <S.FormImageButton onPress={() => setImageSheetVisible(true)} activeOpacity={0.8}>
            {displayImage ? (
              <S.FormImage source={{uri: displayImage}} />
            ) : (
              <Icon name="camera" size={22} color="#ccc" />
            )}
            <S.FormImageBadge>
              <Icon name="edit-2" size={10} color="#fff" />
            </S.FormImageBadge>
          </S.FormImageButton>
          <S.DetailHeaderText>
            <S.HeaderBrandInput
              value={form.brand}
              onChangeText={v => setField('brand', v)}
              placeholder="브랜드"
              placeholderTextColor="#bbb"
              maxLength={100}
            />
            <S.HeaderNameInput
              value={form.name}
              onChangeText={v => setField('name', v)}
              placeholder="실 이름 (필수)"
              placeholderTextColor="#bbb"
              maxLength={100}
              multiline
              blurOnSubmit
            />
          </S.DetailHeaderText>
        </S.FormHeader>

        {/* 실 정보 */}
        <S.Section>
          <S.SectionTitle>실 정보</S.SectionTitle>
          {form.ravelryYarnId != null && hasColorways ? (
            // Ravelry 실: 한 단계 들어가서 컬러웨이 목록에서 선택 (목록에 없으면 거기서 직접 입력)
            <S.FieldRow>
              <S.FieldLabel>색상</S.FieldLabel>
              <S.FieldPressable
                onPress={() =>
                  navigation.navigate(DRAWER_ROUTES.YARN_COLORWAY, {
                    ravelryYarnId: form.ravelryYarnId,
                    yarnName: form.name,
                    selected: form.color,
                    formKey: route.key,
                  })
                }>
                <S.FieldValue placeholder={!form.color}>{form.color || '색상 선택'}</S.FieldValue>
                <Icon name="chevron-right" size={16} color="#bbb" />
              </S.FieldPressable>
            </S.FieldRow>
          ) : (
            renderTextField('색상', 'color', '색상명 또는 색상 번호')
          )}
          {renderTextField('LOT', 'lot', '염색 번호 (예: 3427, 18A)')}
          {renderTextField('합수', 'ply', '예: 3', {unit: '합', maxLength: 10})}
          {renderTextField('성분', 'fiber', '예: Merino 100%', {maxLength: 200})}
          {renderTextField('게이지', 'gauge', '예: 29코 / 10cm')}
          {renderTextField('권장 바늘', 'needleSize', '예: 2.5–3.5mm')}
          {renderTextField('볼당 중량', 'gramsPerBall', '예: 50', {unit: 'g', keyboard: 'decimal-pad', maxLength: 7})}
          {renderTextField('볼당 길이', 'metersPerBall', '예: 270', {unit: 'm', keyboard: 'decimal-pad', maxLength: 8})}
          {form.ravelryYarnId != null && (
            <S.FieldHint>합수는 Ravelry 값이 실제와 다를 수 있어요. 확인 후 수정해주세요.</S.FieldHint>
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
          {renderTextField('구매량', 'ballCount', '볼 수', {unit: '볼', keyboard: 'number-pad', maxLength: 4})}
          {totalGrams != null && <S.FieldHint>총 {totalGrams}g</S.FieldHint>}
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
          {renderTextField('가격', 'price', '가격', {unit: '원', keyboard: 'number-pad', maxLength: 9})}
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

export default YarnFormScreen;
