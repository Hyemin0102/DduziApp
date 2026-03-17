// components/skeleton/PostsGridSkeleton.tsx
import React from 'react';
import {Dimensions} from 'react-native';
import SkeletonItem from './SkeletonItem';
import styled from '@emotion/native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

const DEFAULT_COUNT = 9;

interface Props {
  count?: number;
}

const PostsGridSkeleton = ({count = DEFAULT_COUNT}: Props) => {
  return (
    <Grid>
      {new Array(count).fill('').map((_, idx) => (
        <SkeletonItem
          key={idx}
          style={{width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE}}>
          <Cell />
        </SkeletonItem>
      ))}
    </Grid>
  );
};

export default PostsGridSkeleton;

const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
`;

const Cell = styled.View`
  width: 100%;
  height: 100%;
  background-color: #ebebeb;
  border-width: 1px;
  border-color: #f8f9fa;
`;
