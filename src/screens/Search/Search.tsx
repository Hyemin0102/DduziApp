import React, {useState, useEffect, useRef, useCallback} from 'react';
import {ActivityIndicator, FlatList, Keyboard, InteractionManager} from 'react-native';
import {RefreshControl} from 'react-native-gesture-handler';
import {useFocusEffect} from '@react-navigation/native';
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
  const isFocused = useRef(true);
  const inputRef = useRef<any>(null);

  // unmount 시 (뒤로가기) 상태 정리
  useEffect(() => {
    return () => {
      setRefreshing(false);
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      inputRef.current?.focus();
    });
    return unsubscribe;
  }, [navigation]);

  // 탭 전환 시 상태 정리 (혹시 탭 네비게이터 안으로 이동할 경우 대비)
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      return () => {
        isFocused.current = false;
      };
    }, []),
  );

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
      const {data: userData} = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id ?? null;

      const {data: postIds, error: rpcError} = await supabase.rpc(
        'search_posts',
        {search_query: query},
      );

      if (rpcError) throw rpcError;

      if (!postIds || postIds.length === 0) {
        if (isFocused.current) {
          setSearchResults([]);
        }
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
          ),
          projects (
            id,
            title,
            visibility,
            is_completed,
            user_id
          )
        `,
        )
        .in('id', ids)
        .order('created_at', {ascending: false});

      if (error) throw error;

      const results: Post[] = data
        ? (data as any[])
            .filter((post: any) => {
              const proj = post.projects;
              if (post.project_id && !proj) return false;
              if (!proj || proj.visibility !== 'private') return true;
              return proj.user_id === currentUserId;
            })
            .map((post: any) => ({
              ...post,
              post_images: (post.post_images || []).sort(
                (a: any, b: any) => a.display_order - b.display_order,
              ),
            }))
        : [];

      if (isFocused.current) {
        setSearchResults(results);
      }
    } catch (error) {
      console.error('검색 에러:', error);
      if (isFocused.current) {
        setSearchResults([]);
      }
    } finally {
      if (isFocused.current) {
        setLoading(false);
        setRefreshing(false); // finally에서 통합 처리
      }
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
  };

  const renderItem = ({item}: {item: Post}) => <PostCard post={item} />;

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <S.CenterContainer>
          <ActivityIndicator size="large" color="#191919" />
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
          <S.EmptySubText>
            프로젝트 제목 또는 작성자로 검색할 수 있습니다
          </S.EmptySubText>
        </S.CenterContainer>
      );
    }

    return null;
  };

  return (
    <S.Container>
      <S.SearchHeader>
        <S.BackButton
          onPress={() => {
            Keyboard.dismiss();
            navigation.goBack();
          }}>
          <Icon name="chevron-left" size={28} color="#333" />
        </S.BackButton>
        <S.SearchInputContainer>
          <S.SearchInput
            ref={inputRef}
            placeholder="프로젝트 제목 또는 작성자 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            placeholderTextColor="#999"
            maxLength={20}
          />
          {searchQuery.length > 0 && (
            <S.ClearButton onPress={handleClear}>
              <Icon name="x" size={12} color="#fff" />
            </S.ClearButton>
          )}
          <S.SearchIconButton onPress={() => handleSearch(searchQuery)}>
            <Icon name="search" size={20} color="#999" />
          </S.SearchIconButton>
        </S.SearchInputContainer>
      </S.SearchHeader>

      <FlatList
        data={ !loading ? searchResults : []}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{flexGrow: 1}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#191919"
          />
        }
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardDismissMode="on-drag"
      />
    </S.Container>
  );
};

export default Search;