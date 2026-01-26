import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import {RefreshControl} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import {Post} from '@/@types/database';
import * as S from './Search.style';
import useCommonNavigation from '@/hooks/useCommonNavigation';

const Search = () => {
  const {navigation} = useCommonNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      const {data: postIds, error: rpcError} = await supabase.rpc(
        'search_posts',
        {search_query: query},
      );

      if (rpcError) throw rpcError;

      if (!postIds || postIds.length === 0) {
        setSearchResults([]);
        return;
      }

      const ids = (postIds as any[]).map((p: any) => p.id);

      const {data, error} = await supabase
        .from('posts')
        .select(
          `
          *,
          post_images (*),
          users (
            id,
            nickname,
            profile_image
          )
        `,
        )
        .in('id', ids)
        .order('created_at', {ascending: false});

      if (error) throw error;

      const results: Post[] = data
        ? (data as any[]).map((post: any) => ({
            ...post,
            post_images: (post.post_images || []).sort(
              (a: any, b: any) => a.display_order - b.display_order,
            ),
          }))
        : [];

      setSearchResults(results);
    } catch (error) {
      console.error('검색 에러:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const onRefresh = async () => {
    if (!searchQuery.trim()) return;
    setRefreshing(true);
    await handleSearch(searchQuery);
    setRefreshing(false);
  };

  const renderItem = ({item}: {item: Post}) => <PostCard post={item} />;

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <S.CenterContainer>
          <ActivityIndicator size="large" color="#007AFF" />
        </S.CenterContainer>
      );
    }

    if (hasSearched && searchResults.length === 0) {
      return (
        <S.CenterContainer>
          <S.EmptyText>검색 결과가 없습니다</S.EmptyText>
          <S.EmptySubText>다른 검색어로 다시 시도해보세요</S.EmptySubText>
        </S.CenterContainer>
      );
    }

    if (!hasSearched) {
      return (
        <S.CenterContainer>
          <S.EmptyText>검색어를 입력해주세요</S.EmptyText>
          <S.EmptySubText>제목 또는 작성자로 검색할 수 있습니다</S.EmptySubText>
        </S.CenterContainer>
      );
    }

    return null;
  };

  return (
    <S.Container>
      <S.SearchHeader>
      <S.BackButton onPress={() => {
          Keyboard.dismiss(); // 🔥 뒤로가기 버튼 클릭 시 키보드 닫기
          navigation.goBack();
        }}>
          <Icon name="chevron-left" size={28} color="#333" />
        </S.BackButton>
        <S.SearchInputContainer>
          <S.SearchInput
            placeholder="제목 또는 작성자 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            placeholderTextColor="#999"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <S.ClearButton onPress={handleClear}>
              <S.ClearButtonText>X</S.ClearButtonText>
            </S.ClearButton>
          )}
        </S.SearchInputContainer>
        <S.SearchButton onPress={() => handleSearch(searchQuery)}>
          <S.SearchButtonText>검색</S.SearchButtonText>
        </S.SearchButton>
      </S.SearchHeader>

      <FlatList
        data={loading ? [] : searchResults}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardDismissMode="on-drag"
      />
    </S.Container>
  );
};

export default Search;
