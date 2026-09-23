import React, {useState} from 'react';
import {FlatList, ActivityIndicator} from 'react-native';
import {supabase} from '@/lib/supabase';
import * as S from './ExploreScreen.style';

// 1차 목표: Ravelry 검색 API 응답을 실제로 받아와서 어떤 필드가 있는지 확인하는 단계.
// 필드가 확정되면 카드/상세 화면을 정식으로 설계함
export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: fnError} = await supabase.functions.invoke(
        'ravelry-search',
        {body: {query, page: 1}},
      );
      if (fnError) {
        // FunctionsHttpError의 message는 "non-2xx status code"뿐이라
        // 실제 원인은 context(Response)에서 body를 읽어야 나옴
        const detail = await fnError.context?.text?.().catch(() => null);
        throw new Error(detail || fnError.message);
      }
      if (data?.error) throw new Error(JSON.stringify(data));

      setResults(data?.patterns ?? []);
      setRawResponse(data);
    } catch (e) {
      console.error('❌ Ravelry 검색 실패:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.Container>
      <S.SearchRow>
        <S.SearchInput
          placeholder="도안 검색 (예: hat, cardigan)"
          placeholderTextColor="#bbb"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <S.SearchButton onPress={handleSearch} activeOpacity={0.8}>
          <S.SearchButtonText>검색</S.SearchButtonText>
        </S.SearchButton>
      </S.SearchRow>

      {loading && <ActivityIndicator style={{marginTop: 20}} color="#191919" />}
      {error && <S.StatusText>오류: {error}</S.StatusText>}
      {!loading && !error && results.length === 0 && (
        <S.StatusText>검색어를 입력해보세요</S.StatusText>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({item}) => (
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
        )}
        ListFooterComponent={
          rawResponse ? (
            <>
              <S.DebugSectionLabel>
                디버그: 첫 번째 결과 원본 JSON (필드 확인용)
              </S.DebugSectionLabel>
              <S.DebugBox nestedScrollEnabled>
                <S.DebugText selectable>
                  {JSON.stringify(results[0] ?? rawResponse, null, 2)}
                </S.DebugText>
              </S.DebugBox>
            </>
          ) : null
        }
      />
    </S.Container>
  );
}
