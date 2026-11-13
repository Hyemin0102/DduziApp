import React, {useCallback, useLayoutEffect, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, TouchableOpacity} from 'react-native';
import {RouteProp, useFocusEffect, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import {DrawerStackParamList} from '@/@types/navigation';
import {DRAWER_ROUTES, PROJECTS_ROUTES} from '@/constants/navigation.constant';
import {UserYarnWithProjects} from '@/@types/database';
import {
  InfoRow,
  deleteYarn,
  fetchYarn,
  formatGramsWithBalls,
  formatYarnUsage,
  yarnImageUrl,
  yarnInfoRows,
  yarnRemaining,
} from '@/lib/userYarns';
import * as S from './YarnForm.style';

// 서랍장 > 실 상세
const YarnDetailScreen = () => {
  const route = useRoute<RouteProp<DrawerStackParamList, typeof DRAWER_ROUTES.YARN_DETAIL>>();
  const {navigation} = useCommonNavigation<any>();
  const {yarnId} = route.params;

  const [yarn, setYarn] = useState<UserYarnWithProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  // 수정 후 돌아왔을 때도 최신 값이 보이도록 포커스마다 조회
  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchYarn(yarnId)
        .then(data => active && setYarn(data))
        .catch(e => {
          console.error('실 상세 조회 실패:', e);
          if (active) {
            Alert.alert('오류', '실 정보를 불러오지 못했어요.');
            navigation.goBack();
          }
        })
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [yarnId, navigation]),
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
    if (!yarn) return;
    Alert.alert('실 삭제', '서랍장에서 이 실을 삭제할까요?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteYarn(yarn);
            navigation.goBack();
          } catch (e) {
            console.error('실 삭제 실패:', e);
            Alert.alert('오류', '실 삭제에 실패했어요.');
          }
        },
      },
    ]);
  };

  if (loading || !yarn) {
    return (
      <S.Center>
        <ActivityIndicator size="large" color="#999" />
      </S.Center>
    );
  }

  const image = yarnImageUrl(yarn);
  const {spec: yarnRows, purchase} = yarnInfoRows(yarn);

  // 사용량(프로젝트별 합계) / 남은 양 자동 계산
  const {used, remaining} = yarnRemaining(
    yarn,
    yarn.projects.map(p => p.used_grams),
  );
  const purchaseRows: InfoRow[] = [
    ...purchase.slice(0, 1), // 구매량 바로 아래에 사용량/남은 양
    ['사용량', used > 0 ? formatGramsWithBalls(used, yarn.grams_per_ball) : null],
    [
      '남은 양',
      remaining == null || used === 0
        ? null
        : remaining >= 0
        ? formatGramsWithBalls(remaining, yarn.grams_per_ball)
        : '사용량이 구매량보다 많아요. 구매량을 업데이트해주세요.',
    ],
    ...purchase.slice(1),
  ];

  const renderRows = (rows: InfoRow[]) => {
    const filled = rows.filter(([, v]) => !!v);
    if (filled.length === 0) return <S.DetailEmpty>입력된 정보가 없어요.</S.DetailEmpty>;
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
          {image ? (
            <S.DetailImage source={{uri: image}} />
          ) : (
            <S.DetailImagePlaceholder>
              <Icon name="image" size={22} color="#ccc" />
            </S.DetailImagePlaceholder>
          )}
          <S.DetailHeaderText>
            {!!yarn.brand && <S.DetailBrand>{yarn.brand}</S.DetailBrand>}
            <S.DetailName>{yarn.name}</S.DetailName>
          </S.DetailHeaderText>
        </S.DetailHeader>

        <S.Section>
          <S.SectionTitle>실 정보</S.SectionTitle>
          {renderRows(yarnRows)}
        </S.Section>

        <S.Section>
          <S.SectionTitle>구매 정보</S.SectionTitle>
          {renderRows(purchaseRows)}
        </S.Section>

        <S.Section>
          <S.SectionTitle>연결된 프로젝트</S.SectionTitle>
          {yarn.projects.length > 0 ? (
            yarn.projects.map(p => (
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
                {(p.used_grams != null || p.purpose_tags.length > 0) && (
                  <S.DetailLabel style={{width: undefined}}>
                    {formatYarnUsage(p, yarn.grams_per_ball)}
                  </S.DetailLabel>
                )}
                <Icon name="chevron-right" size={18} color="#ccc" />
              </S.ProjectRow>
            ))
          ) : (
            <S.DetailEmpty>연결된 프로젝트가 없어요.</S.DetailEmpty>
          )}
        </S.Section>

        <S.Section style={{borderBottomWidth: 0}}>
          <S.SectionTitle>메모</S.SectionTitle>
          {yarn.memo ? <S.DetailMemo>{yarn.memo}</S.DetailMemo> : <S.DetailEmpty>메모가 없어요.</S.DetailEmpty>}
        </S.Section>
      </ScrollView>

      <ActionSheetModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        actions={[
          {
            label: '수정',
            onPress: () => navigation.navigate(DRAWER_ROUTES.YARN_FORM, {yarnId: yarn.id}),
          },
          {label: '삭제', isDestructive: true, onPress: handleDelete},
        ]}
      />
    </S.Container>
  );
};

export default YarnDetailScreen;
