import React, {useEffect, useRef, useState} from 'react';
import {
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {ExploreStackParamList} from '@/@types/navigation';
import {EXPLORE_ROUTES} from '@/constants/navigation.constant';
import FilterSheet, {AppliedFilters} from './FilterSheet';
import * as S from './ExploreScreen.style';

type ExploreMainRouteProp = RouteProp<
  ExploreStackParamList,
  typeof EXPLORE_ROUTES.EXPLORE_MAIN
>;

const SORT_OPTIONS = [
  {key: 'popularity', label: '가장 인기있는'},
  {key: 'recently-popular', label: '최근 인기있는'},
  {key: 'created', label: '새로 출시된'},
] as const;

interface SearchOverrides {
  query?: string;
  sort?: string;
  category?: string | null;
  craft?: string | null;
  freeOnly?: boolean;
  koreanOnly?: boolean;
}

const PAGE_SIZE = 20;

// 1차 목표: Ravelry 검색 API 응답을 실제로 받아와서 어떤 필드가 있는지 확인하는 단계.
// 필드가 확정되면 카드/상세 화면을 정식으로 설계함
export default function ExploreScreen() {
  const {navigation} = useCommonNavigation();
  const {params} = useRoute<ExploreMainRouteProp>();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<string>('popularity');
  const [category, setCategory] = useState<string | null>(null);
  const [craft, setCraft] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [koreanOnly, setKoreanOnly] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState({top: 0, left: 0});
  const sortButtonRef = useRef<View>(null);
  const activeFilterCount =
    (category ? 1 : 0) + (craft ? 1 : 0) + (freeOnly ? 1 : 0) + (koreanOnly ? 1 : 0);
  const currentSortLabel =
    SORT_OPTIONS.find(opt => opt.key === sort)?.label ?? SORT_OPTIONS[0].label;

  const openSortMenu = () => {
    sortButtonRef.current?.measureInWindow((x, y, _width, height) => {
      setSortMenuPosition({top: y + height + 4, left: x});
      setSortMenuVisible(true);
    });
  };

  // 도안 상세에서 디자이너 이름을 탭해서 들어온 경우 그 이름으로 바로 검색,
  // 아니면(최초 진입) 필터 없이 인기순 기본 목록을 불러옴
  useEffect(() => {
    if (params?.initialQuery) {
      setQuery(params.initialQuery);
      handleSearch({query: params.initialQuery});
    } else {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.initialQuery]);

  const fetchPatterns = async (
    overrides: SearchOverrides,
    targetPage: number,
    append: boolean,
  ) => {
    const searchQuery = overrides.query ?? query;
    const searchSort = overrides.sort ?? sort;
    const searchCategory = overrides.category !== undefined ? overrides.category : category;
    const searchCraft = overrides.craft !== undefined ? overrides.craft : craft;
    const searchFreeOnly = overrides.freeOnly ?? freeOnly;
    const searchKoreanOnly = overrides.koreanOnly ?? koreanOnly;

    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    const requestBody = {
      query: searchQuery,
      page: targetPage,
      page_size: PAGE_SIZE,
      sort: searchSort,
      pc: searchCategory ?? undefined,
      craft: searchCraft ?? undefined,
      availability: searchFreeOnly ? 'free' : undefined,
      // Ravelry는 한국어를 표준 ISO 코드(ko)가 아니라 자체 코드 'kr'로 씀
      language: searchKoreanOnly ? 'kr' : undefined,
    };
    console.log('[ravelry] patterns/search.json 요청:', requestBody);
    try {
      const {data, error: fnError} = await supabase.functions.invoke(
        'ravelry-search',
        {body: requestBody},
      );
      if (fnError) {
        // FunctionsHttpError의 message는 "non-2xx status code"뿐이라
        // 실제 원인은 context(Response)에서 body를 읽어야 나옴
        const detail = await fnError.context?.text?.().catch(() => null);
        throw new Error(detail || fnError.message);
      }
      if (data?.error) throw new Error(JSON.stringify(data));

      console.log(
        '[ravelry] patterns/search.json 응답:',
        {paginator: data?.paginator, count: data?.patterns?.length},
        data,
      );
      const newPatterns = data?.patterns ?? [];
      setResults(prev => (append ? [...prev, ...newPatterns] : newPatterns));
      setPage(targetPage);
      // downloadable=false 필터링 때문에 반환 개수가 page_size보다 적어도 다음
      // 실제 페이지가 있을 수 있어서, paginator 기준으로 더 있는지 판단함
      setHasMore(
        data?.paginator
          ? targetPage < data.paginator.page_count
          : newPatterns.length === PAGE_SIZE,
      );
    } catch (e) {
      console.error('❌ Ravelry 검색 실패:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  const handleSearch = (overrides: SearchOverrides = {}) => fetchPatterns(overrides, 1, false);

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchPatterns({}, page + 1, true);
  };

  return (
    <S.Container>
      <S.SearchRow>
        <S.SearchInputContainer>
          <S.SearchInput
            placeholder="도안/작가명을 검색해주세요."
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <S.ClearButton onPress={() => setQuery('')}>
              <Icon name="x" size={12} color="#fff" />
            </S.ClearButton>
          )}
        </S.SearchInputContainer>
        <S.SearchButton onPress={() => handleSearch()} activeOpacity={0.8}>
          <S.SearchButtonText>검색</S.SearchButtonText>
        </S.SearchButton>
      </S.SearchRow>

      <S.FilterRow>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <View ref={sortButtonRef} collapsable={false}>
            <S.FilterButton onPress={openSortMenu} activeOpacity={0.7}>
              <S.ChipText>{currentSortLabel}</S.ChipText>
              <Icon name="chevron-down" size={14} color="#333" />
            </S.FilterButton>
          </View>

          <S.FilterButton
            active={activeFilterCount > 0}
            onPress={() => setFilterSheetVisible(true)}
            activeOpacity={0.7}>
            <Icon name="sliders" size={14} color={activeFilterCount > 0 ? '#fff' : '#333'} />
            <S.ChipText active={activeFilterCount > 0}>
              필터{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </S.ChipText>
          </S.FilterButton>
        </View>
      </S.FilterRow>

      <Modal
        transparent
        visible={sortMenuVisible}
        animationType="fade"
        onRequestClose={() => setSortMenuVisible(false)}>
        <Pressable style={{flex: 1}} onPress={() => setSortMenuVisible(false)}>
          <View
            style={{
              position: 'absolute',
              top: sortMenuPosition.top,
              left: sortMenuPosition.left,
              backgroundColor: '#fff',
              borderRadius: 10,
              paddingVertical: 4,
              minWidth: 150,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  setSort(opt.key);
                  handleSearch({sort: opt.key});
                  setSortMenuVisible(false);
                }}
                style={{paddingVertical: 12, paddingHorizontal: 16}}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: sort === opt.key ? '700' : '400',
                    color: sort === opt.key ? '#191919' : '#666',
                  }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        category={category}
        craft={craft}
        freeOnly={freeOnly}
        koreanOnly={koreanOnly}
        onApply={(filters: AppliedFilters) => {
          setCategory(filters.category);
          setCraft(filters.craft);
          setFreeOnly(filters.freeOnly);
          setKoreanOnly(filters.koreanOnly);
          handleSearch(filters);
        }}
      />

      {loading && <ActivityIndicator style={{marginTop: 20}} color="#191919" />}
      {error && <S.StatusText>오류: {error}</S.StatusText>}
      {!loading && !error && results.length === 0 && (
        <S.StatusText>검색 결과가 없어요</S.StatusText>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({item}) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(EXPLORE_ROUTES.PATTERN_DETAIL, {
                patternId: item.id,
                patternName: item.name,
              })
            }>
            <S.ResultCard>
              <S.ResultThumbnail
                source={{
                  uri:
                    item.first_photo?.medium_url ??
                    item.first_photo?.square_url ??
                    item.photo?.medium_url,
                }}
              />
              <S.ResultInfo>
                <S.ResultTitle numberOfLines={1}>{item.name}</S.ResultTitle>
                <S.ResultSubText numberOfLines={1}>
                  {item.designer?.name ?? item.permalink}
                </S.ResultSubText>
              </S.ResultInfo>
            </S.ResultCard>
          </TouchableOpacity>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{paddingVertical: 20}} color="#191919" />
          ) : null
        }
      />
    </S.Container>
  );
}
