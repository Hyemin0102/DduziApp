import React from 'react';
import SkeletonItem from './SkeletonItem';
import * as S from './PostCardSkeleton.style';

const CARD_COUNT = 3;

const PostCardSkeleton = ({count = CARD_COUNT}: {count?: number}) => {
  return (
    <>
      {new Array(count).fill('').map((_, idx) => (
        <S.Card key={idx}>
          <S.ProfileRow>
            <SkeletonItem style={{width: 48, height: 48, borderRadius: 24}}>
              <S.Avatar />
            </SkeletonItem>
            <SkeletonItem style={{flex: 1, height: 14, borderRadius: 6}}>
              <S.NameLine />
            </SkeletonItem>
          </S.ProfileRow>

          <SkeletonItem style={{width: '100%', height: 200}}>
            <S.ImageArea />
          </SkeletonItem>

          <S.ContentArea>
            <SkeletonItem style={{width: '40%', height: 20, borderRadius: 10}}>
              <S.BadgeLine />
            </SkeletonItem>
            <SkeletonItem style={{width: '100%', height: 14, borderRadius: 6}}>
              <S.TextLine />
            </SkeletonItem>
            <SkeletonItem style={{width: '75%', height: 14, borderRadius: 6}}>
              <S.TextLine />
            </SkeletonItem>
            <SkeletonItem style={{width: '30%', height: 12, borderRadius: 6}}>
              <S.DateLine />
            </SkeletonItem>
          </S.ContentArea>
        </S.Card>
      ))}
    </>
  );
};

export default PostCardSkeleton;
