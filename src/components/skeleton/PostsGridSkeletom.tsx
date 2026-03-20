// components/skeleton/PostsGridSkeleton.tsx
import React from 'react';
import {Dimensions} from 'react-native';
import SkeletonItem from './SkeletonItem';
import * as S from './PostsGridSkeleton.style';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

const DEFAULT_COUNT = 9;

interface Props {
  count?: number;
}

const PostsGridSkeleton = ({count = DEFAULT_COUNT}: Props) => {
  return (
    <S.Grid>
      {new Array(count).fill('').map((_, idx) => (
        <SkeletonItem
          key={idx}
          style={{width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}}>
          <S.Cell />
        </SkeletonItem>
      ))}
    </S.Grid>
  );
};

export default PostsGridSkeleton;
