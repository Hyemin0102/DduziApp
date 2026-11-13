import React, {memo} from 'react';
import {Dimensions, StyleSheet, TouchableOpacity, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import {thumbnailUrl} from '@/lib/imageTransform';

export interface ExplorePost {
  id: string;
  image_url: string;
  image_count: number;
}

export const EXPLORE_COLUMNS = 3;
// 간격 없이 3칸이 화면 너비를 꽉 채움
const TILE_SIZE = Dimensions.get('window').width / EXPLORE_COLUMNS;

interface Props {
  posts: ExplorePost[];
  onPress: (postId: string) => void;
}

// 검색 화면 둘러보기: 썸네일 3개짜리 한 줄 (인스타 둘러보기처럼 정사각형, 사진 여러 장이면 아이콘)
const ExploreGridRow = ({posts, onPress}: Props) => {
  return (
    <View style={styles.row}>
      {posts.map(post => (
        <TouchableOpacity
          key={post.id}
          style={styles.tile}
          activeOpacity={0.8}
          onPress={() => onPress(post.id)}>
          <FastImage
            style={styles.image}
            source={{uri: thumbnailUrl(post.image_url) ?? post.image_url}}
          />
          {post.image_count > 1 && (
            <View style={styles.multiBadge}>
              <Icon name="layers" size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default memo(ExploreGridRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  multiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 0},
  },
});
