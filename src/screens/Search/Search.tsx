import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {ActivityIndicator, FlatList, Keyboard, InteractionManager} from 'react-native';
import {RefreshControl} from 'react-native-gesture-handler';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import NativeAdCard from '@/components/common/NativeAdCard';
import SavedProjectSearchCard from '@/components/common/SavedProjectSearchCard';
import NativeAdCardRounded from '@/components/common/NativeAdCardRounded';
import {Post} from '@/@types/database';
import * as S from './Search.style';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {profileUrl} from '@/lib/imageTransform';
import {getProjectDateLabel} from '@/lib/projectDate';
import {trackEvent} from '@/lib/mixpanel';

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

// 검색 결과는 홈 피드보다 스크롤이 짧고 목적성이 강한 화면이라, 광고 빈도를
// 홈(5~8개)보다 낮게(8~10개) 잡음 — 결정론적 패턴이라 결과가 갱신돼도
// 순서상 앞부분 광고 위치는 안 바뀜
const SEARCH_AD_GAP_SEQUENCE = [8, 10, 9, 10, 8, 9];

type SearchFeedItem =
  | {type: 'post'; key: string; post: Post}
  | {type: 'ad'; key: string};

const buildSearchFeedItems = (posts: Post[]): SearchFeedItem[] => {
  const items: SearchFeedItem[] = [];
  let nextAdAt = SEARCH_AD_GAP_SEQUENCE[0];
  let adSeq = 0;

  posts.forEach((post, index) => {
    items.push({type: 'post', key: post.id.toString(), post});
    if (index + 1 === nextAdAt) {
      items.push({type: 'ad', key: `ad-${adSeq}`});
      adSeq += 1;
      nextAdAt += SEARCH_AD_GAP_SEQUENCE[adSeq % SEARCH_AD_GAP_SEQUENCE.length];
    }
  });

  return items;
};

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
      const {data} = await supabase.rpc('get_most_saved_projects', {
        limit_count: 5,
      });
      if (!data) return;

      const projects = data as MostSavedProject[];
      const missingThumbnailIds = projects
        .filter(p => !p.thumbnail_url)
        .map(p => p.project_id);

      if (missingThumbnailIds.length === 0) {
        setMostSavedProjects(projects);
        return;
      }

      // 대표이미지가 없는 프로젝트는 가장 먼저 올린 게시물의 첫 사진으로 대체
      const {data: postsData} = await supabase
        .from('posts')
        .select('project_id, created_at, post_images ( image_url, display_order )')
        .in('project_id', missingThumbnailIds)
        .order('created_at', {ascending: true});

      const fallbackThumbnails: Record<string, string> = {};
      postsData?.forEach((post: any) => {
        if (fallbackThumbnails[post.project_id]) return;
        const firstImage = (post.post_images || [])
          .slice()
          .sort((a: any, b: any) => a.display_order - b.display_order)[0];
        if (firstImage?.image_url) {
          fallbackThumbnails[post.project_id] = firstImage.image_url;
        }
      });

      setMostSavedProjects(
        projects.map(p =>
          p.thumbnail_url || !fallbackThumbnails[p.project_id]
            ? p
            : {...p, thumbnail_url: fallbackThumbnails[p.project_id]},
        ),
      );
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
    trackEvent('search_performed', {query});

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

  const feedItems = useMemo(() => buildSearchFeedItems(searchResults), [searchResults]);

  const renderItem = ({item}: {item: SearchFeedItem}) =>
    item.type === 'ad' ? <NativeAdCard /> : <PostCard post={item.post} />;

  const renderSavedProjectCard = (project: MostSavedProject) => (
    <SavedProjectSearchCard
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
      onPress={() => {
        trackEvent('most_saved_project_tapped', {
          project_id: project.project_id,
        });
        navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
          projectId: project.project_id,
          projectTitle: project.title,
        });
      }}
    />
  );

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
                        trackEvent('trending_keyword_tapped', {keyword});
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
              <S.TrendingProjects>
                <S.TrendingSection style={{paddingBottom: 4}}>
                  <S.TrendingTitle style={{marginBottom: 8}}>
                    뜨개함에 많이 저장됐어요
                  </S.TrendingTitle>
                </S.TrendingSection>
                {mostSavedProjects.map(renderSavedProjectCard)}
               {/* <NativeAdCardRounded /> */}
              </S.TrendingProjects>
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
        data={!loading ? feedItems : []}
        keyExtractor={item => item.key}
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