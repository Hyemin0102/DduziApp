import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import { HOME_ROUTES, POST_ROUTES, TAB_ROUTES } from '@/constants/navigation.constant';
import styled from '@emotion/native';
import { Post } from '@/@types/post';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

//홈, 탐색 페이지에서 사용
const PostCard: React.FC<PostCardProps> = ({post}) => {
  const navigation = useNavigation<any>();


  return (
    <S.CardContainer>
      {/* 프로필 영역 */}
      <S.ProfileSection>
        <S.ProfileImage
          source={{uri: post.users.profile_image}}
          resizeMode="cover"
        />
        <S.Username>{post.users.username}</S.Username>
      </S.ProfileSection>

      {/* 이미지 슬라이더 */}
      {post.post_images && post.post_images.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}>
          {post.post_images.map((image, index) => (
            <S.ImageContainer key={index}>
              <S.PostImage
                source={{uri: image.image_url}}
                resizeMode="cover"
              />
              <S.ImageCounter>
                {index + 1} / {post.post_images.length}
              </S.ImageCounter>
            </S.ImageContainer>
          ))}
        </ScrollView>
      )}

      {/* 게시물 내용 */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('PostDetail', {postId: post.id})
        }>
        <S.ContentSection>
          <S.Title>{post.title}</S.Title>
          <S.Content numberOfLines={3}>{post.content}</S.Content>
          <S.Date>{new Date(post.created_at).toLocaleDateString('ko-KR')}</S.Date>
        </S.ContentSection>
      </TouchableOpacity>
    </S.CardContainer>
  );
};

const S = {
  CardContainer: styled.View`
    background-color: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid;
  `,
  ProfileSection: styled.View`
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
    //width: ${SCREEN_WIDTH * 0.9}px;
    width: 200px;
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
    right: 16px;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 6px 12px;
    border-radius: 16px;
    color: #ffffff;
    font-size: 12px;
  `,
  ContentSection: styled.View`
    margin-top: 12px;
  `,
  Title: styled.Text`
    font-weight: 700;
    font-size: 16px;
    color: #333;
    margin-bottom: 8px;
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
};

export default PostCard;