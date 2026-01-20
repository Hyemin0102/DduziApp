import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import {ActivityIndicator, FlatList, Keyboard, Text, TouchableWithoutFeedback, View} from 'react-native';
import * as S from './Discover.style';
import PostCard from '@/components/common/PostCard';

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
    // 검색 함수
    const handleSearch = async (query: string) => {
      Keyboard.dismiss();
      if (!query.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }
  
      setLoading(true);
      setHasSearched(true);
  
      try {
              // RPC 함수 호출
          const {data: postIds, error: rpcError} = await supabase
          .rpc('search_posts', {search_query: query});

        if (rpcError) throw rpcError;

        if (!postIds || postIds.length === 0) {
          setSearchResults([]);
          return;
        }

        const ids = (postIds as any[]).map((p: any) => p.id);

        // posts 데이터와 관계 데이터 가져오기
        const {data, error} = await supabase
          .from('posts')
          .select(
            `
            *,
            post_images (*),
            users (
              id,
              username,
              profile_image
            )
          `
          )
          .in('id', ids)
          .order('created_at', {ascending: false});

        if (error) throw error;

        setSearchResults(data || []);
      } catch (error) {
        console.error('검색 에러:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };


  // 검색어 변경 시 디바운스 적용 (선택사항)
  const handleChangeText = (text: string) => {
    setSearchQuery(text);

  };

  // 검색 버튼 클릭
  const onSearchPress = () => {
    handleSearch(searchQuery);
  };

  return (
  
    <S.Container>
      {/* 검색 입력창 */}
      <S.SearchContainer>
        <S.SearchInput
          placeholder="제목 또는 작성자 검색"
          value={searchQuery}
          onChangeText={handleChangeText}
          onSubmitEditing={onSearchPress}
          returnKeyType="search"
          placeholderTextColor="#999"
        />
        <S.SearchButton onPress={onSearchPress}>
          <S.SearchButtonText>검색</S.SearchButtonText>
        </S.SearchButton>
      </S.SearchContainer>

      {/* 로딩 */}
      {loading && (
        <S.LoadingContainer>
          <ActivityIndicator size="large" color="#007AFF" />
        </S.LoadingContainer>
      )}

      {/* 검색 결과 없음 */}
      {!loading && hasSearched && searchResults.length === 0 && (
        <S.EmptyContainer>
          <S.EmptyText>검색 결과가 없습니다</S.EmptyText>
          <S.EmptySubText>
            다른 검색어로 다시 시도해보세요
          </S.EmptySubText>
        </S.EmptyContainer>
      )}

      {/* 검색 결과 리스트 */}
      {!loading && searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <PostCard
              post={item}
            />
          )}
          contentContainerStyle={{paddingBottom: 20}}
          onScrollBeginDrag={Keyboard.dismiss}
            keyboardDismissMode="on-drag"
        />
      )}

      {/* 초기 상태 (검색 전) */}
      {!loading && !hasSearched && (
        <S.InitialContainer>
          <S.InitialText>검색어를 입력해주세요</S.InitialText>
        </S.InitialContainer>
      )}
    </S.Container>
  
  );
};

export default Discover;
