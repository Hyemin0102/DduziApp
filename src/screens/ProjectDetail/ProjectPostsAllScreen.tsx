import React, {useState, useCallback, useEffect} from 'react';
import {
  FlatList,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {RouteProp, useRoute} from '@react-navigation/native';
import {supabase} from '@/lib/supabase';
import {thumbnailUrl} from '@/lib/imageTransform';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import Icon from 'react-native-vector-icons/Feather';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';

const PAGE_SIZE = 20;

type RouteParams = {
  ProjectPostsAll: {projectId: string; projectTitle?: string};
};

interface PostImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface PostItem {
  id: string;
  content: string | null;
  created_at: string;
  post_images: PostImage[];
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
}

function PostContent({content}: {content: string}) {
  const [isTruncated, setIsTruncated] = useState(false);
  return (
    <>
      <Text style={styles.content}>{content}</Text>
    </>
  );
}

export default function ProjectPostsAllScreen() {
  const route = useRoute<RouteProp<RouteParams, 'ProjectPostsAll'>>();
  const {projectId} = route.params;
  const {navigation} = useCommonNavigation<any>();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [projectFlags, setProjectFlags] = useState({likesEnabled: true, commentsEnabled: true});

  useEffect(() => {
    supabase
      .from('projects')
      .select('likes_enabled, comments_enabled')
      .eq('id', projectId)
      .single()
      .then(({data}) => {
        if (data) {
          setProjectFlags({
            likesEnabled: data.likes_enabled ?? true,
            commentsEnabled: data.comments_enabled ?? true,
          });
        }
      });
  }, [projectId]);

  // 게시물 목록의 좋아요/댓글 카운트+좋아요 여부를 배치 조회해서 머지
  // (게시물당 쿼리 날리면 N+1이라 post_id in (...)으로 한 번씩만, Home.tsx와 동일 패턴)
  const attachLikesAndComments = async (items: PostItem[]): Promise<PostItem[]> => {
    if (items.length === 0) return items;
    const postIds = items.map(p => p.id);
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

    return items.map(p => ({
      ...p,
      likes_count: likesCountMap[p.id] || 0,
      is_liked: likedPostIds.has(p.id),
      comments_count: commentsCountMap[p.id] || 0,
    }));
  };

  const fetchPosts = useCallback(
    async (pageNum: number) => {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const {data, error, count} = await supabase
        .from('posts')
        .select(
          `id, content, created_at,
           post_images ( id, image_url, display_order )`,
          {count: 'exact'},
        )
        .eq('project_id', projectId)
        .order('created_at', {ascending: false})
        .range(from, to);

      if (error) return;

      const items: PostItem[] = await attachLikesAndComments(
        (data as any[]).map(p => ({
          ...p,
          post_images: (p.post_images || []).sort(
            (a: PostImage, b: PostImage) => a.display_order - b.display_order,
          ),
        })),
      );

      if (pageNum === 0) {
        setPosts(items);
        if (count !== null) setTotalCount(count);
      } else {
        setPosts(prev => [...prev, ...items]);
      }
      setHasMore(items.length === PAGE_SIZE);
    },
    [projectId],
  );

  useEffect(() => {
    fetchPosts(0).finally(() => setLoading(false));
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, fetchPosts]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        totalCount > 0 ? (
          <Text style={styles.totalCount}>총 {totalCount}개의 게시물</Text>
        ) : null
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            size="small"
            color="#191919"
            style={styles.footer}
          />
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>게시물이 없습니다</Text>
        </View>
      }
      renderItem={({item, index}) => {
        const isLast = index === posts.length - 1 && !hasMore;
        const firstImage = item.post_images[0];

        return (
          <TouchableOpacity
            style={[styles.card, isLast && styles.cardLast]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(POST_ROUTES.POST_DETAIL, {postId: item.id})
            }>
            {firstImage && (
              <FastImage
                source={{
                  uri:
                    thumbnailUrl(firstImage.image_url) ?? firstImage.image_url,
                }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            )}
            <View
              style={[
                styles.cardContent,
                !firstImage && styles.cardContentNoImage,
              ]}>
              <View style={styles.dateRow}>
                <Icon name="calendar" size={11} color="#191919" />
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                {item.likes_count !== undefined && (
                  <View style={styles.statsRow}>
                    {projectFlags.likesEnabled && (
                      <View style={styles.statItem}>
                        <FA5Icon
                          name="heart"
                          solid={item.is_liked}
                          size={12}
                          color={item.is_liked ? '#FF3B30' : '#999'}
                        />
                        {(item.likes_count ?? 0) > 0 && (
                          <Text style={styles.statText}>{item.likes_count}</Text>
                        )}
                      </View>
                    )}
                    {projectFlags.commentsEnabled && (
                      <View style={styles.statItem}>
                        <FA5Icon name="comment" solid={false} size={12} color="#999" />
                        {(item.comments_count ?? 0) > 0 && (
                          <Text style={styles.statText}>{item.comments_count}</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
              {item.content ? <PostContent content={item.content} /> : null}
              {item.post_images.length > 1 && (
                <View style={styles.imageCountRow}>
                  <Icon name="image" size={11} color="#bbb" />
                  <Text style={styles.imageCount}>
                    사진 {item.post_images.length}장
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 40,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  footer: {paddingVertical: 16},
  totalCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  emptyText: {fontSize: 15, color: '#999'},
  card: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 14,
    alignItems: 'flex-start',
  },
  cardLast: {
    borderBottomWidth: 0,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#f1f1ef',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  cardContentNoImage: {
    paddingVertical: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191919',
  },
  content: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  more: {
    fontSize: 13,
    color: '#bbb',
  },
  imageCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  imageCount: {
    fontSize: 11,
    color: '#bbb',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
});
