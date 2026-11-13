import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Keyboard} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {useAuth} from '@/contexts/AuthContext';
import ActionSheetModal from '@/components/modal/ActionSheetModal';
import {DRAWER_ROUTES} from '@/constants/navigation.constant';
import {UserNeedle, UserYarn} from '@/@types/database';
import {fetchMyYarns, yarnImageUrl} from '@/lib/userYarns';
import {
  categoryLabel,
  fetchMyNeedles,
  formatSizeRange,
  needleDisplayName,
  needleTypeLabel,
} from '@/lib/userNeedles';
import * as S from './DrawerScreen.style';

type DrawerTab = 'yarn' | 'needle';

// 서랍장 메인: 실 / 바늘 상단 탭
const DrawerScreen = () => {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const [activeTab, setActiveTab] = useState<DrawerTab>('yarn');
  const [query, setQuery] = useState('');
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [yarns, setYarns] = useState<UserYarn[]>([]);
  const [loading, setLoading] = useState(true);
  const [needles, setNeedles] = useState<UserNeedle[]>([]);
  const [needleLoading, setNeedleLoading] = useState(true);

  // 실/바늘 추가·수정·삭제 후 돌아왔을 때 반영되도록 포커스마다 조회
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let active = true;
      fetchMyYarns(user.id)
        .then(data => active && setYarns(data))
        .catch(e => console.error('서랍장 실 목록 조회 실패:', e))
        .finally(() => active && setLoading(false));
      fetchMyNeedles(user.id)
        .then(data => active && setNeedles(data))
        .catch(e => console.error('서랍장 바늘 목록 조회 실패:', e))
        .finally(() => active && setNeedleLoading(false));
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const changeTab = (tab: DrawerTab) => {
    Keyboard.dismiss();
    setActiveTab(tab);
    setQuery('');
  };

  // 이름/브랜드/색상/LOT로 검색
  const filteredYarns = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return yarns;
    return yarns.filter(y =>
      [y.name, y.brand, y.color, y.lot]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q)),
    );
  }, [yarns, query]);

  // 이름(자동 이름 포함)/브랜드/종류/모양/호수로 검색
  const filteredNeedles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return needles;
    return needles.filter(n =>
      [
        needleDisplayName(n),
        n.brand,
        categoryLabel(n.category),
        needleTypeLabel(n.needle_type),
        ...n.sizes_mm.map(mm => `${Number(mm)}mm`),
      ]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q)),
    );
  }, [needles, query]);

  const renderTabs = () => (
    <S.TabContainer>
      <S.Tab onPress={() => changeTab('yarn')}>
        <S.TabText active={activeTab === 'yarn'}>실</S.TabText>
        {activeTab === 'yarn' && <S.TabIndicator />}
      </S.Tab>
      <S.Tab onPress={() => changeTab('needle')}>
        <S.TabText active={activeTab === 'needle'}>바늘</S.TabText>
        {activeTab === 'needle' && <S.TabIndicator />}
      </S.Tab>
    </S.TabContainer>
  );

  const renderYarnItem = ({item}: {item: UserYarn}) => {
    const image = yarnImageUrl(item);
    const meta = [
      item.color,
      item.ball_count != null ? `${item.ball_count}볼` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <S.YarnCard
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate(DRAWER_ROUTES.YARN_DETAIL, {yarnId: item.id})
        }>
        {image ? (
          <S.YarnThumbnail source={{uri: image}} />
        ) : (
          <S.YarnThumbnailPlaceholder>
            <Icon name="image" size={18} color="#ccc" />
          </S.YarnThumbnailPlaceholder>
        )}
        <S.YarnInfo>
          {!!item.brand && (
            <S.YarnCompany numberOfLines={1}>{item.brand}</S.YarnCompany>
          )}
          <S.YarnName numberOfLines={1}>{item.name}</S.YarnName>
          {!!meta && <S.YarnMeta numberOfLines={1}>{meta}</S.YarnMeta>}
        </S.YarnInfo>
        <Icon name="chevron-right" size={18} color="#ccc" />
      </S.YarnCard>
    );
  };

  const renderYarnEmpty = () => {
    if (loading) {
      return (
        <S.Center>
          <ActivityIndicator size="large" color="#999" />
        </S.Center>
      );
    }
    if (yarns.length > 0) {
      return (
        <S.Empty>
          <S.EmptyText>검색 결과가 없어요</S.EmptyText>
          <S.EmptySubText>다른 검색어로 다시 시도해보세요.</S.EmptySubText>
        </S.Empty>
      );
    }
    return (
      <S.Empty>
        <S.EmptyIcon
          source={require('../../assets/images/dduzi_image.png')}
          resizeMode="contain"
        />
        <S.EmptyText>서랍장에 실이 없어요</S.EmptyText>
        <S.EmptySubText>
          Ravelry 에서 가져오거나 직접 입력해서{'\n'}가지고 있는 실을
          정리해보세요!
        </S.EmptySubText>
      </S.Empty>
    );
  };

  const renderYarnTab = () => (
    <>
      <S.SearchRow>
        <S.SearchInputContainer>
          <Icon name="search" size={16} color="#999" />
          <S.SearchInput
            placeholder="내 서랍장의 실을 검색해주세요."
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <S.ClearButton onPress={() => setQuery('')}>
              <Icon name="x" size={12} color="#fff" />
            </S.ClearButton>
          )}
        </S.SearchInputContainer>
      </S.SearchRow>

      <FlatList
        data={loading ? [] : filteredYarns}
        keyExtractor={item => item.id}
        renderItem={renderYarnItem}
        ListEmptyComponent={renderYarnEmpty}
        contentContainerStyle={
          filteredYarns.length === 0 || loading ? {flexGrow: 1} : undefined
        }
        // 목록을 스크롤하거나 아무 곳이나 누르면 키보드 내려감
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="never"
      />

      <S.AddButton onPress={() => setAddSheetVisible(true)}>
        <Icon name="plus" size={18} color="#fff" />
        <S.AddButtonText>실 추가</S.AddButtonText>
      </S.AddButton>
    </>
  );

  const renderNeedleItem = ({item}: {item: UserNeedle}) => {
    const hasCustomName = !!item.name?.trim();
    const meta = [
      `${categoryLabel(item.category)} ${needleTypeLabel(item.needle_type)}`,
      item.is_set
        ? `세트 ${formatSizeRange(item.sizes_mm)}`
        : formatSizeRange(item.sizes_mm),
      !item.is_set && item.cable_lengths_cm[0]
        ? `${item.cable_lengths_cm[0]}cm`
        : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <S.YarnCard
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate(DRAWER_ROUTES.NEEDLE_DETAIL, {needleId: item.id})
        }>
        {item.image_url ? (
          <S.YarnThumbnail source={{uri: item.image_url}} />
        ) : (
          <S.YarnThumbnailPlaceholder>
            <Icon name="image" size={18} color="#ccc" />
          </S.YarnThumbnailPlaceholder>
        )}
        <S.YarnInfo>
          {/* 자동 이름에는 브랜드가 이미 들어가 있어서 직접 입력한 이름일 때만 브랜드를 따로 표시 */}
          {hasCustomName && !!item.brand && (
            <S.YarnCompany numberOfLines={1}>{item.brand}</S.YarnCompany>
          )}
          <S.YarnName numberOfLines={1}>{needleDisplayName(item)}</S.YarnName>
          <S.YarnMeta numberOfLines={1}>{meta}</S.YarnMeta>
        </S.YarnInfo>
        <Icon name="chevron-right" size={18} color="#ccc" />
      </S.YarnCard>
    );
  };

  const renderNeedleEmpty = () => {
    if (needleLoading) {
      return (
        <S.Center>
          <ActivityIndicator size="large" color="#999" />
        </S.Center>
      );
    }
    if (needles.length > 0) {
      return (
        <S.Empty>
          <S.EmptyText>검색 결과가 없어요</S.EmptyText>
          <S.EmptySubText>다른 검색어로 다시 시도해보세요.</S.EmptySubText>
        </S.Empty>
      );
    }
    return (
      <S.Empty>
        <S.EmptyIcon
          source={require('../../assets/images/dduzi_image.png')}
          resizeMode="contain"
        />
        <S.EmptyText>서랍장에 바늘이 없어요</S.EmptyText>
        <S.EmptySubText>
          가지고 있는 바늘을 등록하고{'\n'}호수별로 한눈에 확인해보세요!
        </S.EmptySubText>
      </S.Empty>
    );
  };

  const renderNeedleTab = () => (
    <>
      <S.SearchRow>
        <S.SearchInputContainer>
          <Icon name="search" size={16} color="#999" />
          <S.SearchInput
            placeholder="내 서랍장의 바늘을 검색해주세요. (예: 4mm)"
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <S.ClearButton onPress={() => setQuery('')}>
              <Icon name="x" size={12} color="#fff" />
            </S.ClearButton>
          )}
        </S.SearchInputContainer>
      </S.SearchRow>

      <FlatList
        data={needleLoading ? [] : filteredNeedles}
        keyExtractor={item => item.id}
        renderItem={renderNeedleItem}
        ListEmptyComponent={renderNeedleEmpty}
        contentContainerStyle={
          filteredNeedles.length === 0 || needleLoading
            ? {flexGrow: 1}
            : undefined
        }
        // 목록을 스크롤하거나 아무 곳이나 누르면 키보드 내려감
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="never"
      />

      {/* 바늘은 직접 입력만 지원 → 바로 폼으로 이동 */}
      <S.AddButton
        onPress={() => navigation.navigate(DRAWER_ROUTES.NEEDLE_FORM)}>
        <Icon name="plus" size={18} color="#fff" />
        <S.AddButtonText>바늘 추가</S.AddButtonText>
      </S.AddButton>
    </>
  );

  return (
    <S.Container>
      {renderTabs()}
      {activeTab === 'yarn' ? renderYarnTab() : renderNeedleTab()}

      <ActionSheetModal
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        actions={[
          {
            label: 'Ravelry 에서 가져오기',
            onPress: () =>
              navigation.navigate(DRAWER_ROUTES.YARN_RAVELRY_SEARCH),
          },
          {
            label: '직접 입력',
            onPress: () => navigation.navigate(DRAWER_ROUTES.YARN_FORM),
          },
        ]}
      />
    </S.Container>
  );
};

export default DrawerScreen;
