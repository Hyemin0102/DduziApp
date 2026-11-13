import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {ActivityIndicator, FlatList, Keyboard, InteractionManager, ScrollView} from 'react-native';
import {RefreshControl} from 'react-native-gesture-handler';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {supabase} from '@/lib/supabase';
import PostCard from '@/components/common/PostCard';
import NativeAdCard from '@/components/common/NativeAdCard';
import SavedProjectSearchCard from '@/components/common/SavedProjectSearchCard';
import ExploreGridRow, {EXPLORE_COLUMNS, ExplorePost} from '@/components/common/ExploreGridRow';
import NativeAdCardRounded from '@/components/common/NativeAdCardRounded';
import WeeklyTopPosterCard from '@/components/common/WeeklyTopPosterCard';
import {Post} from '@/@types/database';
import * as S from './Search.style';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {PROJECTS_ROUTES, POST_ROUTES} from '@/constants/navigation.constant';
import {profileUrl} from '@/lib/imageTransform';
import {trackEvent} from '@/lib/mixpanel';
import PostCommentsSheet from '@/components/common/PostCommentsSheet';
import PostLikersSheet from '@/components/common/PostLikersSheet';

interface OpenComments {
  postId: string;
  postOwnerId: string;
  postContent: string | null;
  projectId: string;
  projectTitle: string;
}

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

interface WeeklyTopPoster {
  user_id: string;
  nickname: string;
  profile_image: string | null;
  post_count: number;
}

// 검색 결과는 홈 피드보다 스크롤이 짧고 목적성이 강한 화면이라, 광고 빈도를
// 홈(5~8개)보다 낮게(8~10개) 잡음 — 결정론적 패턴이라 결과가 갱신돼도
// 순서상 앞부분 광고 위치는 안 바뀜
const SEARCH_AD_GAP_SEQUENCE = [8, 10, 9, 10, 8, 9];

type SearchFeedItem =
  | {type: 'post'; key: string; post: Post}
  | {type: 'ad'; key: string};

// 검색 전 화면의 둘러보기 그리드 한 줄
type ExploreRowItem = {type: 'explore'; key: string; posts: ExplorePost[]};
type ListItem = SearchFeedItem | ExploreRowItem;

// 둘러보기: 최신순, 3의 배수로 잘라서 줄이 중간에 비지 않게
const EXPLORE_PAGE_SIZE = 30;

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
  const [weeklyTopPosters, setWeeklyTopPosters] = useState<WeeklyTopPoster[]>([]);
  const [openComments, setOpenComments] = useState<OpenComments | null>(null);
  const [likersPostId, setLikersPostId] = useState<string | null>(null);
  const isFocused = useRef(true);
  const inputRef = useRef<any>(null);

  // 둘러보기 (검색 전 화면 하단 3그리드)
  const [explorePosts, setExplorePosts] = useState<ExplorePost[]>([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreLoadingMore, setExploreLoadingMore] = useState(false);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const explorePageRef = useRef(0);
  const blockedIdsRef = useRef<string[] | null>(null);

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
    const fetchWeeklyTopPosters = async () => {
      const {data} = await supabase.rpc('get_weekly_top_posters', {
        limit_count: 5,
      });
      if (data) setWeeklyTopPosters(data as WeeklyTopPoster[]);
    };
    fetchWeeklyTopPosters();
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


  const getBlockedIds = async (): Promise<string[]> => {
    if (blockedIdsRef.current) return blockedIdsRef.current;
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return [];
    const {data: blocks} = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    blockedIdsRef.current = blocks ? blocks.map(b => b.blocked_id) : [];
    return blockedIdsRef.current;
  };

  // 홈 피드와 같은 조건(공개 프로젝트, 차단 사용자 제외, 최신순) — 썸네일만 필요해서 이미지만 조회
  const fetchExplorePage = async (page: number) => {
    const ids = await getBlockedIds();
    let query = supabase
      .from('posts')
      .select('id, post_images ( image_url, display_order ), projects!inner ( visibility )')
      .eq('projects.visibility', 'public')
      .order('created_at', {ascending: false})
      .range(page * EXPLORE_PAGE_SIZE, (page + 1) * EXPLORE_PAGE_SIZE - 1);
    if (ids.length > 0) {
      query = query.not('user_id', 'in', `(${ids.join(',')})`);
    }
    const {data, error} = await query;
    if (error) throw error;
    const rows = (data ?? []) as any[];
    const posts: ExplorePost[] = rows.flatMap(post => {
      const images = (post.post_images || [])
        .slice()
        .sort((a: any, b: any) => a.display_order - b.display_order);
      if (!images[0]?.image_url) return [];
      return [{id: post.id, image_url: images[0].image_url, image_count: images.length}];
    });
    return {posts, hasMore: rows.length === EXPLORE_PAGE_SIZE};
  };

  const loadExplore = async () => {
    try {
      const {posts, hasMore} = await fetchExplorePage(0);
      explorePageRef.current = 0;
      setExplorePosts(posts);
      setExploreHasMore(hasMore);
    } catch (error) {
      console.error('둘러보기 로드 실패:', error);
    } finally {
      setExploreLoading(false);
    }
  };

  const loadMoreExplore = async () => {
    if (hasSearched || exploreLoading || exploreLoadingMore || !exploreHasMore) return;
    setExploreLoadingMore(true);
    try {
      const nextPage = explorePageRef.current + 1;
      const {posts, hasMore} = await fetchExplorePage(nextPage);
      explorePageRef.current = nextPage;
      setExploreHasMore(hasMore);
      setExplorePosts(prev => {
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...posts.filter(p => !seen.has(p.id))];
      });
    } catch (error) {
      console.error('둘러보기 추가 로드 실패:', error);
    } finally {
      setExploreLoadingMore(false);
    }
  };

  useEffect(() => {
    loadExplore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 검색 결과 페이지 단위로 좋아요/댓글 카운트+좋아요 여부를 배치 조회해서 머지
  // (게시물당 쿼리 날리면 N+1이라 post_id in (...)으로 한 번씩만 조회, Home.tsx와 동일 패턴)
  const attachLikesAndComments = async (posts: Post[]): Promise<Post[]> => {
    if (posts.length === 0) return posts;
    const postIds = posts.map(p => p.id);
    const {data: {user}} = await supabase.auth.getUser();

    const [{data: likesData}, {data: commentsData}] = await Promise.all([
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
    ]);

    const likesCountMap: Record<string, number> = {};
    const likedPostIds = new Set<string>();
    (likesData || []).forEach((l: any) => {
      likesCountMap[l.post_id] = (likesCountMap[l.post_id] || 0) + 1;
      if (user && l.user_id === user.id) likedPostIds.add(l.post_id);
    });

    const commentsCountMap: Record<string, number> = {};
    (commentsData || []).forEach((c: any) => {
      commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1;
    });

    return posts.map(p => ({
      ...p,
      likes_count: likesCountMap[p.id] || 0,
      is_liked: likedPostIds.has(p.id),
      comments_count: commentsCountMap[p.id] || 0,
    }));
  };

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
            profile_image,
            supporter_level,
            show_supporter_badge
          ),
          projects (
            id,
            title,
            visibility,
            is_completed,
            status,
            user_id,
            likes_enabled,
            comments_enabled
          )
        `,
        )
        .in('id', ids)
        .order('created_at', {ascending: false});

      if (error) throw error;

      const filtered: Post[] = data
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

      const results = await attachLikesAndComments(filtered);

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
    if (!hasSearched) {
      setRefreshing(true);
      await loadExplore();
      setRefreshing(false);
      return;
    }
    if (!searchQuery.trim()) return;
    setRefreshing(true);
    await handleSearch(searchQuery);
  };

  const feedItems = useMemo(() => buildSearchFeedItems(searchResults), [searchResults]);

  const exploreRows = useMemo(() => {
    const rows: ExploreRowItem[] = [];
    for (let i = 0; i < explorePosts.length; i += EXPLORE_COLUMNS) {
      const posts = explorePosts.slice(i, i + EXPLORE_COLUMNS);
      rows.push({type: 'explore', key: `explore-${posts[0].id}`, posts});
    }
    return rows;
  }, [explorePosts]);

  const openPostDetail = useCallback(
    (postId: string) => navigation.navigate(POST_ROUTES.POST_DETAIL, {postId}),
    [navigation],
  );

  const handleLikeToggled = (postId: string, liked: boolean) => {
    setSearchResults(prev =>
      prev.map(p =>
        p.id === postId
          ? {...p, is_liked: liked, likes_count: Math.max(0, (p.likes_count ?? 0) + (liked ? 1 : -1))}
          : p,
      ),
    );
  };

  const handleOpenLikers = (post: Post) => {
    setLikersPostId(post.id);
  };

  const handleOpenComments = (post: Post) => {
    setOpenComments({
      postId: post.id,
      postOwnerId: post.user_id,
      postContent: post.content ?? null,
      projectId: post.projects.id,
      projectTitle: post.projects.title,
    });
  };

  const renderItem = ({item}: {item: ListItem}) =>
    item.type === 'explore' ? (
      <ExploreGridRow posts={item.posts} onPress={openPostDetail} />
    ) : item.type === 'ad' ? (
      <NativeAdCard />
    ) : (
      <PostCard
        post={item.post}
        onLikeToggled={handleLikeToggled}
        onOpenComments={handleOpenComments}
        onOpenLikers={handleOpenLikers}
      />
    );

  const renderSavedProjectCard = (project: MostSavedProject) => (
    <SavedProjectSearchCard
      key={project.project_id}
      ownerNickname={project.owner_nickname}
      ownerAvatarUri={
        profileUrl(project.owner_profile_image) ?? project.owner_profile_image
      }
      title={project.title}
      thumbnailUrl={project.thumbnail_url}
      onPress={() => {
        navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
          projectId: project.project_id,
          projectTitle: project.title,
        });
      }}
    />
  );

  const renderExploreHeader = () => (
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

      {/* {weeklyTopPosters.length > 0 && (
        <S.TrendingProjects>
          <S.TrendingSection style={{paddingBottom: 0}}>
            <S.TrendingTitle>위클리 뜨개왕 ✨</S.TrendingTitle>
          </S.TrendingSection>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingTop: 8, paddingLeft: 20, paddingBottom: 0}}>
            {weeklyTopPosters.map((poster, index) => (
              <WeeklyTopPosterCard
                key={poster.user_id}
                rank={index + 1}
                nickname={poster.nickname}
                profileImage={
                  profileUrl(poster.profile_image) ?? poster.profile_image
                }
                postCount={poster.post_count}
                onPress={() => {
                  trackEvent('weekly_top_poster_tapped', {
                    user_id: poster.user_id,
                    rank: index + 1,
                  });
                  navigation.navigate(POST_ROUTES.POSTS_MAIN, {
                    userId: poster.user_id,
                  });
                }}
              />
            ))}
          </ScrollView>
        </S.TrendingProjects>
      )} */}

      {mostSavedProjects.length > 0 && (
        <S.SavedSection>
          <S.TrendingTitle style={{paddingHorizontal: 20}}>
            최근 뜨개함에 저장됐어요
          </S.TrendingTitle>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 20, gap: 10}}>
            {mostSavedProjects.map(renderSavedProjectCard)}
          </ScrollView>
        </S.SavedSection>
      )}

      {explorePosts.length > 0 && (
        <S.TrendingSection style={{paddingBottom: 0}}>
          <S.TrendingTitle>둘러보기</S.TrendingTitle>
        </S.TrendingSection>
      )}
    </>
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
      if (exploreLoading) {
        return (
          <S.ExploreLoading>
            <ActivityIndicator color="#999" />
          </S.ExploreLoading>
        );
      }
      if (trendingKeywords.length === 0 && mostSavedProjects.length === 0) {
        return (
          <S.CenterContainer>
            <S.EmptyText>검색어를 입력해주세요</S.EmptyText>
            <S.EmptySubText>
              프로젝트 제목 또는 작성자로 검색할 수 있습니다
            </S.EmptySubText>
          </S.CenterContainer>
        );
      }
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

      <FlatList<ListItem>
        data={loading ? [] : hasSearched ? feedItems : exploreRows}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        ListHeaderComponent={!hasSearched && !loading ? renderExploreHeader() : null}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={
          !hasSearched && exploreLoadingMore ? (
            <S.ExploreLoading>
              <ActivityIndicator color="#999" />
            </S.ExploreLoading>
          ) : null
        }
        onEndReached={loadMoreExplore}
        onEndReachedThreshold={0.5}
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

      {/* 카드마다 바텀시트를 두면 FlatList 가상화로 스크롤 중 날아갈 수 있어서
      화면 레벨에 하나만 두고 postId만 바꿔끼움(Home.tsx와 동일 패턴) */}
      <PostLikersSheet
        visible={!!likersPostId}
        onClose={() => setLikersPostId(null)}
        postId={likersPostId ?? ''}
      />

      <PostCommentsSheet
        visible={!!openComments}
        onClose={() => setOpenComments(null)}
        postId={openComments?.postId ?? ''}
        postOwnerId={openComments?.postOwnerId ?? ''}
        postContent={openComments?.postContent ?? null}
        projectId={openComments?.projectId ?? ''}
        projectTitle={openComments?.projectTitle ?? ''}
        onCommentsCountChange={count => {
          if (!openComments) return;
          const {postId} = openComments;
          setSearchResults(prev =>
            prev.map(p => (p.id === postId ? {...p, comments_count: count} : p)),
          );
        }}
      />
    </S.Container>
  );
};

export default Search;