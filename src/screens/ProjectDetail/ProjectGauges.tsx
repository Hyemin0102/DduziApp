import React, {useState} from 'react';
import {ActivityIndicator, Alert} from 'react-native';
import styled from '@emotion/native';
import Icon from 'react-native-vector-icons/Feather';
import KeyboardSheet from '@/components/modal/KeyboardSheet';
import {GaugeDraft, formatGauge} from '@/lib/projectGauges';
import * as S from './ProjectDetailScreen.styles';

export type GaugeItem = GaugeDraft & {id: string};

interface Props {
  gauges: GaugeItem[];
  // 내 프로젝트(또는 작성 중)일 때만 추가/수정/삭제
  editable: boolean;
  // id가 null이면 추가
  onSave: (id: string | null, gauge: GaugeDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type Field = 'stitches' | 'rows' | 'needle' | 'pattern';
const EMPTY = {stitches: '', rows: '', needle: '', pattern: ''};

const toNumber = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

// 프로젝트 상세 > 뜨개 정보 > 게이지 (여러 개, 기준 10cm)
const ProjectGauges = ({gauges, editable, onSave, onDelete}: Props) => {
  const [editing, setEditing] = useState<{id: string | null} | null>(null);
  const [values, setValues] = useState<Record<Field, string>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const open = (g?: GaugeItem) => {
    setEditing({id: g?.id ?? null});
    setValues(
      g
        ? {
            stitches: String(Number(g.stitches)),
            rows: g.rows != null ? String(Number(g.rows)) : '',
            needle: g.needle_mm != null ? String(Number(g.needle_mm)) : '',
            pattern: g.pattern ?? '',
          }
        : EMPTY,
    );
  };

  const close = () => setEditing(null);

  const stitches = toNumber(values.stitches);
  const canSave = !saving && stitches != null;

  const run = async (fn: () => Promise<void>, errorText: string) => {
    setSaving(true);
    try {
      await fn();
      close();
    } catch (e) {
      console.error(errorText, e);
      Alert.alert('오류', errorText);
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!editing || stitches == null) return;
    run(
      () =>
        onSave(editing.id, {
          stitches,
          rows: toNumber(values.rows),
          needle_mm: toNumber(values.needle),
          pattern: values.pattern.trim() || null,
        }),
      '게이지 저장에 실패했어요.',
    );
  };

  const remove = () => {
    if (!editing?.id) return;
    const id = editing.id;
    run(() => onDelete(id), '게이지 삭제에 실패했어요.');
  };

  const setValue = (key: Field, v: string) =>
    setValues(prev => ({...prev, [key]: key === 'pattern' ? v : v.replace(/[^0-9.]/g, '')}));

  const renderInput = (key: Field, label: string, placeholder: string, unit?: string) => (
    <InputRow>
      <InputLabel>
        {label}
        {key === 'stitches' && <Required> *</Required>}
      </InputLabel>
      <Input
        value={values[key]}
        onChangeText={v => setValue(key, v)}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        keyboardType={key === 'pattern' ? 'default' : 'decimal-pad'}
        maxLength={key === 'pattern' ? 30 : 5}
      />
      {!!unit && <Unit>{unit}</Unit>}
    </InputRow>
  );

  return (
    <>
      {gauges.map(g => (
        <S.DirectInfoCard
          key={g.id}
          activeOpacity={0.7}
          disabled={!editable}
          onPress={() => open(g)}>
          <S.InfoValue style={{flex: 1}}>{formatGauge(g)}</S.InfoValue>
        </S.DirectInfoCard>
      ))}

      {editable && (
        <S.DashedAddButton onPress={() => open()}>
          <Icon name="plus" size={13} color="#999" />
          <S.DashedAddButtonText>게이지 추가</S.DashedAddButtonText>
        </S.DashedAddButton>
      )}

      <KeyboardSheet visible={!!editing} onClose={close}>
        <DialogTitle>게이지 {editing?.id ? '수정' : '추가'}</DialogTitle>
        <DialogHint>10cm × 10cm 기준으로 입력해주세요.</DialogHint>
        {renderInput('stitches', '코수', '예: 22', '코')}
        {renderInput('rows', '단수', '예: 30', '단')}
        {renderInput('needle', '바늘', '예: 4', 'mm')}
        {renderInput('pattern', '무늬', '예: 메리야스, 고무단')}
        <Buttons>
          {!!editing?.id && (
            <Button disabled={saving} onPress={remove}>
              <ButtonText destructive>삭제</ButtonText>
            </Button>
          )}
          <Button disabled={saving} onPress={close}>
            <ButtonText>취소</ButtonText>
          </Button>
          <Button primary disabled={!canSave} onPress={save}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ButtonText primary>저장</ButtonText>
            )}
          </Button>
        </Buttons>
      </KeyboardSheet>
    </>
  );
};

export default ProjectGauges;

const DialogTitle = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #191919;
`;

const DialogHint = styled.Text`
  font-size: 12px;
  color: #999;
  margin: 4px 0 8px;
`;

const InputRow = styled.View`
  flex-direction: row;
  align-items: center;
  border-bottom-width: 0.5px;
  border-bottom-color: #eee;
`;

const InputLabel = styled.Text`
  width: 52px;
  font-size: 14px;
  color: #999;
`;

const Required = styled.Text`
  color: #ff3b30;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 44px;
  font-size: 15px;
  color: #191919;
  padding-top: 0;
  padding-bottom: 0;
`;

const Unit = styled.Text`
  font-size: 14px;
  color: #999;
  margin-left: 6px;
`;

const Buttons = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

const Button = styled.TouchableOpacity<{primary?: boolean}>`
  flex: 1;
  height: 48px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  background-color: ${({primary, disabled}) => (primary ? (disabled ? '#ccc' : '#191919') : '#f5f5f5')};
`;

const ButtonText = styled.Text<{primary?: boolean; destructive?: boolean}>`
  font-size: 15px;
  font-weight: 600;
  color: ${({primary, destructive}) => (primary ? '#fff' : destructive ? '#ff3b30' : '#555')};
`;
