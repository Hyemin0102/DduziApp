import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList} from 'react-native';
import styled from '@emotion/native';
import {CommonActions, RouteProp, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {DrawerStackParamList} from '@/@types/navigation';
import {DRAWER_ROUTES} from '@/constants/navigation.constant';
import {RavelryColorway, fetchColorways, formatColorway} from '@/lib/ravelryYarn';
import * as S from './DrawerScreen.style';

// 실 추가/수정 > 색상 > Ravelry 컬러웨이 선택
// API로 사진/hex가 오지 않아서 번호·이름 글자 목록으로 보여주고, 목록에 없으면 검색어를 그대로 직접 입력
const YarnColorwayScreen = () => {
  const route = useRoute<RouteProp<DrawerStackParamList, typeof DRAWER_ROUTES.YARN_COLORWAY>>();
  const {navigation} = useCommonNavigation<any>();
  const {ravelryYarnId, yarnName, selected, formKey} = route.params;

  const [colorways, setColorways] = useState<RavelryColorway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (yarnName) navigation.setOptions({title: `${yarnName} 색상`});
  }, [navigation, yarnName]);

  useEffect(() => {
    fetchColorways(ravelryYarnId)
      .then(setColorways)
      .catch(e => {
        console.error('Ravelry 컬러웨이 조회 실패:', e);
        setError('색상 목록을 불러오지 못했어요.');
      })
      .finally(() => setLoading(false));
  }, [ravelryYarnId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    if (!q) return colorways;
    return colorways.filter(
      c => c.name.toLowerCase().includes(q) || (c.code ?? '').toLowerCase() === q,
    );
  }, [colorways, query]);

  // 선택값을 폼 화면 params로 돌려주고 닫기
  const pick = (value: string) => {
    navigation.dispatch({
      ...CommonActions.setParams({pickedColor: {value, at: Date.now()}}),
      source: formKey,
    });
    navigation.goBack();
  };

  const trimmed = query.trim();
  const showCustom =
    !!trimmed && !colorways.some(c => c.name.toLowerCase() === trimmed.toLowerCase());

  const renderItem = ({item}: {item: RavelryColorway}) => {
    const value = formatColorway(item);
    const isSelected = selected === value;
    return (
      <Row onPress={() => pick(value)} activeOpacity={0.7}>
        <Code>{item.code ? `#${item.code}` : '-'}</Code>
        <Name numberOfLines={1}>{item.name}</Name>
        {isSelected && <Icon name="check" size={16} color="#191919" />}
      </Row>
    );
  };

  return (
    <S.Container>
      <S.SearchRow>
        <S.SearchInputContainer>
          <Icon name="search" size={16} color="#999" />
          <S.SearchInput
            placeholder="색상 이름 또는 번호로 검색"
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
          />
          {query.length > 0 && (
            <S.ClearButton onPress={() => setQuery('')}>
              <Icon name="x" size={12} color="#fff" />
            </S.ClearButton>
          )}
        </S.SearchInputContainer>
      </S.SearchRow>

      {loading ? (
        <S.Center>
          <ActivityIndicator size="large" color="#999" />
        </S.Center>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              {showCustom && (
                <Row onPress={() => pick(trimmed)} activeOpacity={0.7}>
                  <Icon name="plus" size={14} color="#555" />
                  <Name numberOfLines={1}>‘{trimmed}’ 직접 입력</Name>
                </Row>
              )}
              {!!selected && (
                <Row onPress={() => pick('')} activeOpacity={0.7}>
                  <Icon name="x" size={14} color="#999" />
                  <Name style={{color: '#999'}}>색상 지우기</Name>
                </Row>
              )}
            </>
          }
          ListEmptyComponent={
            error ? (
              <S.ErrorText>{error}</S.ErrorText>
            ) : (
              <S.Empty>
                <S.EmptyText>
                  {colorways.length === 0 ? 'Ravelry 에 등록된 색상이 없어요' : '검색 결과가 없어요'}
                </S.EmptyText>
                <S.EmptySubText>검색창에 색상을 입력해서 직접 추가할 수 있어요.</S.EmptySubText>
              </S.Empty>
            )
          }
          contentContainerStyle={filtered.length === 0 ? {flexGrow: 1} : undefined}
        />
      )}
    </S.Container>
  );
};

export default YarnColorwayScreen;

const Row = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

const Code = styled.Text`
  width: 44px;
  font-size: 13px;
  color: #999;
`;

const Name = styled.Text`
  flex: 1;
  font-size: 15px;
  color: #191919;
`;
