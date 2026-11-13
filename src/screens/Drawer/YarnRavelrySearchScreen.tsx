import React, {useEffect, useRef, useState} from 'react';
import {RouteProp, useRoute} from '@react-navigation/native';
import {DrawerStackParamList} from '@/@types/navigation';
import {ActivityIndicator, FlatList, Keyboard} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {DRAWER_ROUTES} from '@/constants/navigation.constant';
import {
  cacheColorways,
  invokeRavelryFunction,
  ravelryYarnToForm,
  yardsToMeters,
} from '@/lib/ravelryYarn';
import * as S from './DrawerScreen.style';

const PAGE_SIZE = 20;
// 검색어가 없을 때 보여주는 인기순 = 레이블리에서 프로젝트가 가장 많이 만들어진 순
const POPULAR_SORT = 'projects';
const SEARCH_SORT = 'best';

// 인기 실 목록은 자주 바뀌지 않으니 앱 실행 중에는 재사용 (화면 재진입마다 API 호출 방지)
let popularCache: {yarns: any[]; page: number; hasMore: boolean} | null = null;

const invokeFunction = invokeRavelryFunction;

// 서랍장 > 실 추가 > 레이블리에서 가져오기
// 진입 시 인기순 목록 → 검색하면 검색 결과 → 결과 탭 → 상세(yarns/{id}.json) 조회 → 자동으로 채운 입력 폼으로 이동
const YarnRavelrySearchScreen = () => {
  const {navigation} = useCommonNavigation<any>();
  const route =
    useRoute<
      RouteProp<DrawerStackParamList, typeof DRAWER_ROUTES.YARN_RAVELRY_SEARCH>
    >();
  const linkProjectId = route.params?.linkProjectId;
  const formParams = linkProjectId
    ? {linkProjectId, fromRavelrySearch: true}
    : {};
  const [query, setQuery] = useState('');
  // 실제로 조회 중인 검색어 ('' = 인기순)
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<any[]>(popularCache?.yarns ?? []);
  const [page, setPage] = useState(popularCache?.page ?? 1);
  const [hasMore, setHasMore] = useState(popularCache?.hasMore ?? false);
  const [loading, setLoading] = useState(!popularCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  // 응답 순서가 뒤바뀌어도(인기순 로딩 중 검색 등) 마지막 요청 결과만 반영
  const requestIdRef = useRef(0);

  const fetchYarns = async (q: string, targetPage: number, append: boolean) => {
    const requestId = ++requestIdRef.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    const requestBody = {
      query: q,
      page: targetPage,
      page_size: PAGE_SIZE,
      sort: q ? SEARCH_SORT : POPULAR_SORT,
    };
    console.log('[ravelry] yarns/search.json 요청:', requestBody);
    try {
      const data = await invokeFunction('ravelry-yarn-search', requestBody);
      if (requestId !== requestIdRef.current) return;
      console.log('[ravelry] yarns/search.json 응답 요약:', {
        paginator: data?.paginator,
        count: data?.yarns?.length,
      });
      console.log(
        '[ravelry] yarns/search.json 응답 전체:',
        JSON.stringify(data?.yarns, null, 2),
      );
      const newYarns = data?.yarns ?? [];
      const nextHasMore = data?.paginator
        ? targetPage < data.paginator.page_count
        : newYarns.length === PAGE_SIZE;
      setResults(prev => {
        const merged = append ? [...prev, ...newYarns] : newYarns;
        if (!q)
          popularCache = {
            yarns: merged,
            page: targetPage,
            hasMore: nextHasMore,
          };
        return merged;
      });
      setPage(targetPage);
      setHasMore(nextHasMore);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      console.error('❌ Ravelry 실 검색 실패:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (requestId === requestIdRef.current) {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    }
  };

  // 진입 시 인기순 목록 (캐시가 있으면 그대로 사용)
  useEffect(() => {
    if (!popularCache) fetchYarns('', 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 인기순으로 돌아가기 — 캐시가 있으면 API 호출 없이 복원
  const showPopular = () => {
    setActiveQuery('');
    if (popularCache) {
      requestIdRef.current++;
      setResults(popularCache.yarns);
      setPage(popularCache.page);
      setHasMore(popularCache.hasMore);
      setLoading(false);
      setError(null);
    } else {
      fetchYarns('', 1, false);
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    const trimmed = query.trim();
    if (!trimmed) {
      if (activeQuery) showPopular();
      return;
    }
    setActiveQuery(trimmed);
    fetchYarns(trimmed, 1, false);
  };

  const handleClear = () => {
    setQuery('');
    if (activeQuery) showPopular();
  };

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchYarns(activeQuery, page + 1, true);
  };

  // 검색 결과엔 성분/권장 바늘이 없어서 상세(yarns/{id}.json)를 조회한 뒤 폼에 채워서 넘김
  const handlePressYarn = async (yarn: any) => {
    if (detailLoadingId) return;
    setDetailLoadingId(yarn.id);
    try {
      // include=colorways: 이 실의 컬러웨이(색상명/번호) 목록도 같이 조회
      const detailBody = {ids: [yarn.id], include: ['colorways']};
      console.log('[ravelry] yarns 상세 요청:', detailBody);
      const data = await invokeFunction('ravelry-yarn-detail', detailBody);
      const colorways = data?.yarns?.[0]?.colorways ?? [];
      console.log(
        '[ravelry] colorways 요약:',
        {
          count: colorways.length,
          withPhoto: colorways.filter((c: any) => c.photo_url).length,
          keys: Array.from(new Set(colorways.flatMap((c: any) => Object.keys(c)))),
        },
      );
      console.log('[ravelry] colorways:', JSON.stringify(colorways, null, 2));
      // 폼에서 색상 선택 화면을 열 때 다시 조회하지 않도록 캐시
      cacheColorways(yarn.id, data?.yarns?.[0]?.colorways);
      console.log(
        '[ravelry] yarns 상세 응답 전체:',
        JSON.stringify(data, null, 2),
      );
      // 상세 조회가 실패해도 검색 결과만으로 채울 수 있는 값은 채워서 진행
      const detail = data?.yarns?.[0] ?? yarn;
      const prefill = ravelryYarnToForm(detail);
      console.log('[ravelry] 폼 자동 채움 값:', prefill);
      navigation.navigate(DRAWER_ROUTES.YARN_FORM, {prefill, ...formParams});
    } catch (e) {
      console.error('❌ Ravelry 실 상세 조회 실패:', e);
      navigation.navigate(DRAWER_ROUTES.YARN_FORM, {
        prefill: ravelryYarnToForm(yarn),
        ...formParams,
      });
    } finally {
      setDetailLoadingId(null);
    }
  };

  const renderItem = ({item}: {item: any}) => {
    const photoUrl =
      item.first_photo?.square_url || item.first_photo?.small_url;
    const meta = [
      item.grams ? `${item.grams}g` : null,
      item.yardage ? `${yardsToMeters(item.yardage)}m` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <S.YarnCard onPress={() => handlePressYarn(item)} activeOpacity={0.7}>
        {photoUrl ? (
          <S.YarnThumbnail source={{uri: photoUrl}} />
        ) : (
          <S.YarnThumbnailPlaceholder>
            <Icon name="image" size={18} color="#ccc" />
          </S.YarnThumbnailPlaceholder>
        )}
        <S.YarnInfo>
          {!!item.yarn_company_name && (
            <S.YarnCompany numberOfLines={1}>
              {item.yarn_company_name}
            </S.YarnCompany>
          )}
          <S.YarnName numberOfLines={1}>{item.name}</S.YarnName>
          {!!meta && <S.YarnMeta numberOfLines={1}>{meta}</S.YarnMeta>}
        </S.YarnInfo>
        {detailLoadingId === item.id && (
          <ActivityIndicator size="small" color="#999" />
        )}
      </S.YarnCard>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <S.Center>
          <ActivityIndicator size="large" color="#999" />
        </S.Center>
      );
    }
    if (error) return <S.ErrorText>{error}</S.ErrorText>;
    return (
      <S.Empty>
        <S.EmptyText>
          {activeQuery ? '검색 결과가 없어요' : 'Ravelry 에서 실을 찾아보세요'}
        </S.EmptyText>
        <S.EmptySubText>
          {activeQuery
            ? '다른 검색어로 다시 시도해보세요.'
            : '실 이름이나 브랜드명으로 검색할 수 있어요.'}
        </S.EmptySubText>
      </S.Empty>
    );
  };

  return (
    <S.Container>
      <S.SearchRow>
        <S.SearchInputContainer>
          <S.SearchInput
            placeholder="실 이름/브랜드를 검색해주세요."
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <S.ClearButton onPress={handleClear}>
              <Icon name="x" size={12} color="#fff" />
            </S.ClearButton>
          )}
        </S.SearchInputContainer>
        <S.SearchButton onPress={handleSearch}>
          <S.SearchButtonText>검색</S.SearchButtonText>
        </S.SearchButton>
      </S.SearchRow>

      <FlatList
        data={loading ? [] : results}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          results.length === 0 || loading ? {flexGrow: 1} : undefined
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          !loading && results.length > 0 ? (
            <S.ListHeaderText>
              {activeQuery ? `‘${activeQuery}’ 검색 결과` : 'Ravelry 인기 실'}
            </S.ListHeaderText>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <S.FooterLoader>
              <ActivityIndicator size="small" color="#999" />
            </S.FooterLoader>
          ) : null
        }
      />
    </S.Container>
  );
};

export default YarnRavelrySearchScreen;
