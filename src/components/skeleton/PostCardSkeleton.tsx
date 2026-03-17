import React from 'react';
import {Dimensions} from 'react-native';
import styled from '@emotion/native';
import SkeletonItem from './SkeletonItem';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_COUNT = 3;

const PostCardSkeleton = ({count = CARD_COUNT}: {count?: number}) => {
  return (
    <>
      {new Array(count).fill('').map((_, idx) => (
        <Card key={idx}>
          {/* 프로필 영역 */}
          <ProfileRow>
            <SkeletonItem style={{width: 48, height: 48, borderRadius: 24}}>
              <Avatar />
            </SkeletonItem>
            <SkeletonItem style={{flex: 1, height: 14, borderRadius: 6}}>
              <NameLine />
            </SkeletonItem>
          </ProfileRow>

          {/* 이미지 영역 */}
          <SkeletonItem style={{width: '100%', height: 200}}>
            <ImageArea />
          </SkeletonItem>

          {/* 콘텐츠 영역 */}
          <ContentArea>
            <SkeletonItem style={{width: '40%', height: 20, borderRadius: 10}}>
              <BadgeLine />
            </SkeletonItem>
            <SkeletonItem style={{width: '100%', height: 14, borderRadius: 6}}>
              <TextLine />
            </SkeletonItem>
            <SkeletonItem style={{width: '75%', height: 14, borderRadius: 6}}>
              <TextLine />
            </SkeletonItem>
            <SkeletonItem style={{width: '30%', height: 12, borderRadius: 6}}>
              <DateLine />
            </SkeletonItem>
          </ContentArea>
        </Card>
      ))}
    </>
  );
};

export default PostCardSkeleton;

const Card = styled.View`
  padding: 20px;
  margin-bottom: 20px;
`;

const ProfileRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const Avatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #ebebeb;
`;

const NameLine = styled.View`
  height: 14px;
  border-radius: 6px;
  background-color: #ebebeb;
`;

const ImageArea = styled.View`
  width: ${SCREEN_WIDTH - 40}px;
  height: 200px;
  border-radius: 8px;
  background-color: #ebebeb;
`;

const ContentArea = styled.View`
  margin-top: 12px;
  gap: 8px;
`;

const BadgeLine = styled.View`
  height: 20px;
  border-radius: 10px;
  background-color: #ebebeb;
`;

const TextLine = styled.View`
  height: 14px;
  border-radius: 6px;
  background-color: #ebebeb;
`;

const DateLine = styled.View`
  height: 12px;
  border-radius: 6px;
  background-color: #ebebeb;
`;
