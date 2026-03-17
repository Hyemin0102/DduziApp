import React, {useState} from 'react';
import {ScrollView, TouchableOpacity, Dimensions, View} from 'react-native';
import {POST_ROUTES} from '@/constants/navigation.constant';
import styled from '@emotion/native';
import {Post} from '@/@types/database';
import useCommonNavigation from '@/hooks/useCommonNavigation';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// 이미지 개별 로드 placeholder
const PostImage = ({uri}: {uri: string}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={{width: '100%', height: '100%', backgroundColor: '#f0f0f0'}}>
      <S.PostImage
        source={{uri}}
        onLoadEnd={() => setLoaded(true)}
        style={{opacity: loaded ? 1 : 0}}
      />
    </View>
  );
};

const PostCard: React.FC<PostCardProps> = ({post}) => {
  const {navigation} = useCommonNavigation();

  return (
    <S.CardContainer>
      {/* 프로필 영역 */}
      <S.ProfileSection
        onPress={() =>
          navigation.navigate(POST_ROUTES.POSTS_MAIN, {userId: post.user_id})
        }>
        <S.ProfileImage
          source={{uri: post.users.profile_image}}
          resizeMode="cover"
        />
        <S.Username>{post.users.nickname}</S.Username>
      </S.ProfileSection>

      {/* 이미지 슬라이더 */}
      {post.post_images && post.post_images.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCREEN_WIDTH - 36}
          decelerationRate="fast"
          contentContainerStyle={{flexGrow: 1}}
          style={{height: 200}}>
          {post.post_images.map((image, index) => (
            <S.ImageContainer key={index} style={{width: SCREEN_WIDTH - 36}}>
              <PostImage uri={image.image_url} />
              {post.post_images.length > 1 && (
                <S.ImageCounter>
                  {index + 1} / {post.post_images.length}
                </S.ImageCounter>
              )}
            </S.ImageContainer>
          ))}
        </ScrollView>
      )}

      {/* 게시물 내용 */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PostDetail', {postId: post.id})}>
        <S.ContentSection>
          {post.projects && (
            <S.BadgeRow>
              <S.ProjectBadge>
                <S.ProjectBadgeText numberOfLines={1}>
                  🧶 {post.projects.title}
                </S.ProjectBadgeText>
              </S.ProjectBadge>
              <S.StatusBadge completed={post.projects.is_completed}>
                <S.StatusBadgeText completed={post.projects.is_completed}>
                  {post.projects.is_completed ? '✅ 완료' : '진행 중'}
                </S.StatusBadgeText>
              </S.StatusBadge>
            </S.BadgeRow>
          )}
          <S.Content numberOfLines={3}>{post.content}</S.Content>
          <S.Date>
            {new Date(post.created_at).toLocaleDateString('ko-KR')}
          </S.Date>
        </S.ContentSection>
      </TouchableOpacity>
    </S.CardContainer>
  );
};

const S = {
  CardContainer: styled.View`
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  `,
  ProfileSection: styled.TouchableOpacity`
    flex-direction: row;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
  `,
  ProfileImage: styled.Image`
    width: 48px;
    height: 48px;
    border-radius: 24px;
  `,
  Username: styled.Text`
    font-weight: bold;
    font-size: 16px;
    color: #333;
  `,
  ImageContainer: styled.View`
    height: 200px;
    position: relative;
  `,
  PostImage: styled.Image`
    width: 100%;
    height: 100%;
  `,
  ImageCounter: styled.Text`
    position: absolute;
    bottom: 16px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 6px 12px;
    border-radius: 16px;
    color: #ffffff;
    font-size: 12px;
  `,
  ContentSection: styled.View`
    margin-top: 12px;
  `,
  Content: styled.Text`
    font-size: 14px;
    color: #666;
    line-height: 20px;
    margin-bottom: 8px;
  `,
  Date: styled.Text`
    font-size: 12px;
    color: #999;
  `,
  BadgeRow: styled.View`
    flex-direction: row;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  `,
  ProjectBadge: styled.View`
    background-color: #f0ecff;
    padding-horizontal: 8px;
    padding-vertical: 3px;
    border-radius: 10px;
    max-width: 160px;
  `,
  ProjectBadgeText: styled.Text`
    font-size: 12px;
    color: #6b4fbb;
    font-weight: 600;
  `,
  StatusBadge: styled.View<{completed: boolean}>`
    background-color: ${({completed}) => (completed ? '#e8f5e9' : '#fff8e1')};
    padding-horizontal: 8px;
    padding-vertical: 3px;
    border-radius: 10px;
  `,
  StatusBadgeText: styled.Text<{completed: boolean}>`
    font-size: 12px;
    color: ${({completed}) => (completed ? '#4CAF50' : '#f59e0b')};
    font-weight: 600;
  `,
};

export default PostCard;
