import React, {useCallback, useLayoutEffect, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, TouchableOpacity} from 'react-native';
import {RouteProp, useFocusEffect, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import {DrawerStackParamList} from '@/@types/navigation';
import {DRAWER_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {UserNeedleWithProjects} from '@/@types/database';
import {
  deleteNeedle,
  fetchNeedle,
  formatMm,
  needleDisplayName,
  needleInfoRows,
  needleSubText,
} from '@/lib/userNeedles';
import {InfoRow} from '@/lib/userYarns';
import * as S from './YarnForm.style';

// 서랍장 > 바늘 상세
const NeedleDetailScreen = () => {
  const route = useRoute<RouteProp<DrawerStackParamList, typeof DRAWER_ROUTES.NEEDLE_DETAIL>>();
  const {navigation} = useCommonNavigation<any>();
  const {needleId} = route.params;

  const [needle, setNeedle] = useState<UserNeedleWithProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchNeedle(needleId)
        .then(data => active && setNeedle(data))
        .catch(e => {
          console.error('바늘 상세 조회 실패:', e);
          if (active) {
            Alert.alert('오류', '바늘 정보를 불러오지 못했어요.');
            navigation.goBack();
          }
        })
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [needleId, navigation]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{padding: 8}}>
          <Icon name="more-horizontal" size={20} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleDelete = () => {
    if (!needle) return;
    Alert.alert('바늘 삭제', '서랍장에서 이 바늘을 삭제할까요?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNeedle(needle);
            navigation.goBack();
          } catch (e) {
            console.error('바늘 삭제 실패:', e);
            Alert.alert('오류', '바늘 삭제에 실패했어요.');
          }
        },
      },
    ]);
  };

  if (loading || !needle) {
    return (
      <S.Center>
        <ActivityIndicator size="large" color="#999" />
      </S.Center>
    );
  }

  const subText = needleSubText(needle);
  const {spec, purchase: purchaseRows} = needleInfoRows(needle);
  // 호수는 칩으로 따로 보여주므로 표에서는 케이블 길이만
  const rows = spec.filter(([label]) => label === '케이블 길이');

  const renderRows = (list: InfoRow[], emptyText?: string) => {
    const filled = list.filter(([, v]) => !!v);
    if (filled.length === 0) return emptyText ? <S.DetailEmpty>{emptyText}</S.DetailEmpty> : null;
    return filled.map(([label, value]) => (
      <S.DetailRow key={label}>
        <S.DetailLabel>{label}</S.DetailLabel>
        <S.DetailValue>{value}</S.DetailValue>
      </S.DetailRow>
    ));
  };

  return (
    <S.Container>
      <ScrollView>
        <S.DetailHeader>
          {needle.image_url ? (
            <S.DetailImage source={{uri: needle.image_url}} />
          ) : (
            <S.DetailImagePlaceholder>
              <Icon name="image" size={22} color="#ccc" />
            </S.DetailImagePlaceholder>
          )}
          <S.DetailHeaderText>
            {!!needle.name?.trim() && !!needle.brand && <S.DetailBrand>{needle.brand}</S.DetailBrand>}
            <S.DetailName>{needleDisplayName(needle)}</S.DetailName>
            <S.DetailSubText>{subText}</S.DetailSubText>
          </S.DetailHeaderText>
        </S.DetailHeader>

        <S.Section>
          <S.SectionTitle>호수</S.SectionTitle>
          <S.TagWrap>
            {[...needle.sizes_mm]
              .map(Number)
              .sort((a, b) => a - b)
              .map(mm => (
                <S.Tag key={mm} disabled>
                  <S.TagText>{formatMm(mm)}</S.TagText>
                </S.Tag>
              ))}
          </S.TagWrap>
          {renderRows(rows)}
        </S.Section>

        <S.Section>
          <S.SectionTitle>구매 정보</S.SectionTitle>
          {renderRows(purchaseRows, '입력된 정보가 없어요.')}
        </S.Section>

        <S.Section>
          <S.SectionTitle>연결된 프로젝트</S.SectionTitle>
          {needle.projects.length > 0 ? (
            needle.projects.map(p => (
              <S.ProjectRow
                key={p.id}
                onPress={() =>
                  navigation.navigate(PROJECTS_ROUTES.PROJECT_DETAIL, {
                    projectId: p.id,
                    projectTitle: p.title,
                    mode: 'view',
                  })
                }>
                {p.thumbnail_url ? (
                  <S.ProjectThumb source={{uri: p.thumbnail_url}} />
                ) : (
                  <S.ProjectThumbPlaceholder>
                    <Icon name="folder" size={16} color="#ccc" />
                  </S.ProjectThumbPlaceholder>
                )}
                <S.ProjectTitle numberOfLines={1}>{p.title}</S.ProjectTitle>
                <Icon name="chevron-right" size={18} color="#ccc" />
              </S.ProjectRow>
            ))
          ) : (
            <S.DetailEmpty>연결된 프로젝트가 없어요.</S.DetailEmpty>
          )}
        </S.Section>

        <S.Section style={{borderBottomWidth: 0}}>
          <S.SectionTitle>메모</S.SectionTitle>
          {needle.memo ? <S.DetailMemo>{needle.memo}</S.DetailMemo> : <S.DetailEmpty>메모가 없어요.</S.DetailEmpty>}
        </S.Section>
      </ScrollView>

      <ActionSheetModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        actions={[
          {
            label: '수정',
            onPress: () => navigation.navigate(DRAWER_ROUTES.NEEDLE_FORM, {needleId: needle.id}),
          },
          {label: '삭제', isDestructive: true, onPress: handleDelete},
        ]}
      />
    </S.Container>
  );
};

export default NeedleDetailScreen;
