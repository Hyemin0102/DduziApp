import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, FlatList} from 'react-native';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import {supabase} from '@/lib/supabase';
import {profileUrl} from '@/lib/imageTransform';
import * as S from './PostLikersSheet.style';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

interface Liker {
  id: string;
  nickname: string;
  profile_image: string | null;
  bio: string | null;
}

interface PostLikersSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

export default function PostLikersSheet({visible, onClose, postId}: PostLikersSheetProps) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fetchLikers = async () => {
      setLoading(true);
      try {
        const {data, error} = await supabase
          .from('likes')
          .select('created_at, users(id, nickname, profile_image, bio)')
          .eq('post_id', postId)
          .order('created_at', {ascending: false});
        if (error) throw error;
        setLikers(
          (data || [])
            .map((row: any) => row.users)
            .filter((u: Liker | null): u is Liker => !!u),
        );
      } catch (error) {
        console.error('❌ 좋아요 목록 로드 실패:', error);
        setLikers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLikers();
  }, [visible, postId]);

  return (
    <ActionSheetModal visible={visible} onClose={onClose} showCancel={false}>
      <S.Container style={{height: SCREEN_HEIGHT * 0.6}}>
        <S.Title>좋아요</S.Title>
        {loading ? (
          <ActivityIndicator size="small" color="#999" style={{paddingVertical: 40}} />
        ) : likers.length === 0 ? (
          <S.Empty>아직 좋아요가 없어요.</S.Empty>
        ) : (
          <FlatList
            data={likers}
            keyExtractor={item => item.id}
            renderItem={({item}) => {
              const avatar = profileUrl(item.profile_image) ?? item.profile_image;
              return (
                <S.Row>
                  {avatar ? (
                    <S.Avatar source={{uri: avatar}} />
                  ) : (
                    <S.AvatarPlaceholder>
                      <S.AvatarPlaceholderText>
                        {item.nickname?.charAt(0) ?? '?'}
                      </S.AvatarPlaceholderText>
                    </S.AvatarPlaceholder>
                  )}
                  <S.TextColumn>
                    <S.Nickname numberOfLines={1} ellipsizeMode="tail">
                      {item.nickname}
                    </S.Nickname>
                    {!!item.bio && (
                      <S.Bio numberOfLines={1} ellipsizeMode="tail">
                        {item.bio}
                      </S.Bio>
                    )}
                  </S.TextColumn>
                </S.Row>
              );
            }}
          />
        )}
      </S.Container>
    </ActionSheetModal>
  );
}
