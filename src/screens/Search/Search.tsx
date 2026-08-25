import React, {useState, useEffect, useRef, useCallback} from 'react';
import {ActivityIndicator, FlatList, Keyboard, InteractionManager} from 'react-native';
import {RefreshControl} from 'react-native-gesture-handler';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import SavedProjectCard from '@/components/common/SavedProjectCard';
import {Post} from '@/@types/database';
import * as S from './Search.style';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {profileUrl} from '@/lib/imageTransform';
import {getProjectDateLabel} from '@/lib/projectDate';

interface MostSavedProject {
  project_id: string;
  title: string;
  thumbnail_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  owner_nickname: string;
  owner_profile_image: string | null;
}

const Search = () => {
  const {navigation} = useCommonNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [mostSavedProjects, setMostSavedProjects] = useState<MostSavedProject[]>([]);
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
    const fetchTrendingKeywords = async () => {
      const {data} = await supabase
        .from('trending_keywords')
        .select('keyword')
        .order('rank', {ascending: true});
      if (data) setTrendingKeywords(data.map(d => d.keyword));
    };
    fetchTrendingKeywords();
  }, []);

  useEffect(() => {
    const fetchMostSavedProjects = async () => {
      const {data} = await supabase
        .from('most_saved_projects')
        .select('*')
        .order('rank', {ascending: true});
      if (data) setMostSavedProjects(data as MostSavedProject[]);
    };
    fetchMostSavedProjects();
  }, []);


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

      const blockedIds: string[] = [];
      if (currentUserId) {
        const {data: blocks} = await supabase
          .from('blocks')
          .select('blocked_id')
          .eq('blocker_id', currentUserId);
        if (blocks) blocks.forEach(b => blockedIds.push(b.blocked_id));
      }

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
              if (blockedIds.includes(post.user_id)) return false;
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
      if (trendingKeywords.length > 0 || mostSavedProjects.length > 0) {
        return (
          <>
            {trendingKeywords.length > 0 && (
              <S.TrendingSection>
                <S.TrendingTitle>지금 많이 뜨고있어요</S.TrendingTitle>
                <S.TrendingTagRow>
                  {trendingKeywords.map(keyword => (
                    <S.TrendingTag
                      key={keyword}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSearchQuery(keyword);
                        handleSearch(keyword);
                      }}>
                      <S.TrendingTagText>
                        {keyword.length > 10 ? `${keyword.slice(0, 10)}...` : keyword}
                      </S.TrendingTagText>
                    </S.TrendingTag>
                  ))}
                </S.TrendingTagRow>
              </S.TrendingSection>
            )}
            {mostSavedProjects.length > 0 && (
              <>
                <S.TrendingSection style={{paddingBottom: 4}}>
                  <S.TrendingTitle style={{marginBottom: 0}}>
                    뜨개함에 많이 저장됐어요
                  </S.TrendingTitle>
                </S.TrendingSection>
                {mostSavedProjects.map(project => (
                  <SavedProjectCard
                    key={project.project_id}
                    ownerNickname={project.owner_nickname}
                    ownerAvatarUri={
                      profileUrl(project.owner_profile_image) ?? project.owner_profile_image
                    }
                    title={project.title}
                    dateLabel={getProjectDateLabel(
                      project.is_completed,
                      project.started_at,
                      project.completed_at,
                    )}
                    thumbnailUrl={project.thumbnail_url}
                    onPress={() =>
                      navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
                        projectId: project.project_id,
                        projectTitle: project.title,
                      })
                    }
                  />
                ))}
              </>
            )}
          </>
        );
      }
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