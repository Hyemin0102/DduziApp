import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {supabase} from '@/lib/supabase';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {ExploreStackParamList} from '@/@types/navigation';
import {EXPLORE_ROUTES} from '@/constants/navigation.constant';
import * as S from './PatternDetailScreen.style';

type PatternDetailRouteProp = RouteProp<
  ExploreStackParamList,
  typeof EXPLORE_ROUTES.PATTERN_DETAIL
>;

const CRAFT_LABEL: Record<string, string> = {
  Knitting: '대바늘',
  Crochet: '코바늘',
};

// gauge_divisor는 게이지 기준 인치 수(1, 2, 4)라서 cm로 환산
// (Ravelry 기준: 1"→2.5cm, 2"→5cm, 4"→10cm)
const GAUGE_DIVISOR_CM: Record<number, number> = {1: 2.5, 2: 5, 4: 10};

function formatGauge(pattern: any): string | undefined {
  if (!pattern.gauge) return undefined;
  const cm = GAUGE_DIVISOR_CM[pattern.gauge_divisor] ?? pattern.gauge_divisor * 2.5;
  const stitchPart = `${pattern.gauge}코`;
  const rowPart = pattern.row_gauge ? ` x ${pattern.row_gauge}단` : '';
  return `${stitchPart}${rowPart} (${cm}cm x ${cm}cm)`;
}

function renderStars(rating: number) {
  return Array.from({length: 5}, (_, i) => {
    const diff = rating - i;
    const iconName = diff >= 1 ? 'star' : diff >= 0.5 ? 'star-half-full' : 'star-outline';
    return <MCIcon key={i} name={iconName} size={15} color="#F5A623" />;
  });
}

export default function PatternDetailScreen() {
  const {params} = useRoute<PatternDetailRouteProp>();
  const {navigation} = useCommonNavigation();
  const {width, height} = useWindowDimensions();
  const [pattern, setPattern] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [yarnIdeas, setYarnIdeas] = useState<any[]>([]);
  const [krwAmount, setKrwAmount] = useState<number | null>(null);
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxDate, setFxDate] = useState<string | null>(null);
  const [priceInfoVisible, setPriceInfoVisible] = useState(false);
  const [priceInfoPosition, setPriceInfoPosition] = useState({bottom: 0, left: 0});
  const infoIconRef = useRef<View>(null);
  const PRICE_INFO_WIDTH = 250;

  const openPriceInfo = () => {
    infoIconRef.current?.measureInWindow((x, y) => {
      setPriceInfoPosition({
        // 아이콘 y좌표를 팝업의 "아래쪽" 기준으로 써서, 실제 팝업 높이와 상관없이
        // 항상 아이콘보다 위쪽에 뜨게 함
        bottom: height - y + 8,
        left: Math.min(x - 10, width - PRICE_INFO_WIDTH - 16),
      });
      setPriceInfoVisible(true);
    });
  };

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: {index: number | null}[]}) => {
      const index = viewableItems[0]?.index;
      if (index != null) setPhotoIndex(index);
    },
  ).current;
  const viewabilityConfig = useRef({itemVisiblePercentThreshold: 50}).current;

  useEffect(() => {
    (async () => {
      const requestBody = {id: params.patternId};
      console.log('[ravelry] patterns/{id}.json 요청:', requestBody);
      try {
        const {data, error: fnError} = await supabase.functions.invoke(
          'ravelry-pattern-detail',
          {body: requestBody},
        );
        if (fnError) {
          const detail = await fnError.context?.text?.().catch(() => null);
          throw new Error(detail || fnError.message);
        }
        if (data?.error) throw new Error(JSON.stringify(data));

        console.log('[ravelry] patterns/{id}.json 응답:', data);
        // Ravelry 응답은 {pattern: {...}} 형태로 감싸져서 옴
        const fetchedPattern = data?.pattern ?? null;
        setPattern(fetchedPattern);

        // 유료 도안이면 원화 대략 환산 — Frankfurter는 키 없이 쓸 수 있는 무료 환율 API
        if (!fetchedPattern?.free && fetchedPattern?.price && fetchedPattern?.currency) {
          try {
            const fxUrl = `https://api.frankfurter.app/latest?amount=${fetchedPattern.price}&from=${fetchedPattern.currency}&to=KRW`;
            console.log('[fx] 요청:', fxUrl);
            const fxRes = await fetch(fxUrl);
            const fxData = await fxRes.json();
            console.log('[fx] 응답:', fxData);
            if (fxData?.rates?.KRW) {
              setKrwAmount(fxData.rates.KRW);
              setFxRate(fxData.rates.KRW / fetchedPattern.price);
              setFxDate(fxData.date);
            }
          } catch (fxError) {
            console.error('❌ 환율 변환 실패:', fxError);
          }
        }

        // 실 추천(Yarn Ideas) — 화면엔 최대 3개까지만 보여줄 거라 그만큼만 상세 조회
        const yarnIds = (fetchedPattern?.packs ?? [])
          .map((p: any) => p.yarn_id)
          .filter(Boolean)
          .slice(0, 3);
        if (yarnIds.length > 0) {
          console.log('[ravelry] yarns/{id}.json 요청:', {ids: yarnIds});
          const {data: yarnData, error: yarnError} = await supabase.functions.invoke(
            'ravelry-yarn-detail',
            {body: {ids: yarnIds}},
          );
          if (!yarnError) {
            console.log('[ravelry] yarns/{id}.json 응답:', yarnData);
            setYarnIdeas(yarnData?.yarns ?? []);
          } else {
            console.error('❌ 실 추천 조회 실패:', yarnError);
          }
        }
      } catch (e) {
        console.error('❌ 도안 상세 조회 실패:', e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [params.patternId]);

  if (loading) {
    return (
      <S.Container>
        <ActivityIndicator style={{marginTop: 40}} color="#191919" />
      </S.Container>
    );
  }

  if (error || !pattern) {
    return (
      <S.Container>
        <S.StatusText>도안 정보를 불러오지 못했어요{error ? `\n${error}` : ''}</S.StatusText>
      </S.Container>
    );
  }

  const photos: any[] = pattern.photos ?? [];
  const author = pattern.pattern_author;
  const authorUser = author?.users?.[0];
  const craftLabel = CRAFT_LABEL[pattern.craft?.name] ?? pattern.craft?.name;
  const needleSizes = (pattern.pattern_needle_sizes ?? [])
    .map((n: any) => {
      const toolLabel = n.knitting ? '대바늘' : n.crochet || n.hook ? '코바늘' : '';
      const mm = n.metric ? `${n.metric}mm` : n.name;
      return toolLabel ? `${toolLabel} ${mm}` : mm;
    })
    .join(', ');
  const categories = (pattern.pattern_categories ?? []).map((c: any) => c.name).join(' · ');
  const languages = (pattern.languages ?? []).map((l: any) => l.name).join(', ');
  const tags = pattern.pattern_attributes ?? [];
  const downloadUrl = pattern.download_location?.url;
  const yarnPacks = (pattern.packs ?? []).filter((p: any) => p.yarn_id).slice(0, 3);

  const infoRows: {label: string; value?: string}[] = [
    {label: '종류', value: craftLabel},
    {label: '게이지', value: formatGauge(pattern)},
    {label: '필요 실량', value: pattern.yardage_description},
    {label: '바늘', value: needleSizes},
    {label: '사이즈', value: pattern.sizes_available},
    {label: '언어', value: languages},
    {label: '카테고리', value: categories},
  ].filter(row => !!row.value);

  return (
    <S.Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        {photos.length > 0 && (
          <S.PhotoWrapper>
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              // 대표 사진 1장만 먼저 로드하고, 나머지는 스와이프할 때 로드되게 해서
              // 상세 화면 진입 시 사진 전체를 한꺼번에 받아오지 않도록 함
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              keyExtractor={item => String(item.id)}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              renderItem={({item}) => (
                <S.PhotoImage
                  style={{width, height: width}}
                  source={{uri: item.medium2_url ?? item.medium_url}}
                  resizeMode="cover"
                />
              )}
            />
            <S.PageIndicator>
              <S.PageIndicatorText>
                {photoIndex + 1} / {photos.length}
              </S.PageIndicatorText>
            </S.PageIndicator>
          </S.PhotoWrapper>
        )}

        <S.Content>
          <S.TitleRow>
            <S.Title>{pattern.name}</S.Title>

        {(pattern.rating_count > 0 || pattern.difficulty_count > 0) && (
            <S.RatingSection>
              {pattern.rating_count > 0 && (
                <S.RatingBlock>
                  <S.RatingLabel>평점</S.RatingLabel>
                  <S.RatingValue>{pattern.rating_average.toFixed(2)}</S.RatingValue>
                </S.RatingBlock>
              )}
              {pattern.difficulty_count > 0 && (
                <S.RatingBlock>
                  <S.RatingLabel>난이도</S.RatingLabel>
                  <S.RatingValueRow>
                    <S.RatingValue>{pattern.difficulty_average.toFixed(1)}</S.RatingValue>
                    {/* <S.RatingValueUnit> /10</S.RatingValueUnit> */}
                  </S.RatingValueRow>
                </S.RatingBlock>
              )}
            </S.RatingSection>
          )}
          </S.TitleRow>

      
          {author && (
            <S.DesignerRow
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate(EXPLORE_ROUTES.EXPLORE_MAIN, {
                  initialQuery: author.name,
                })
              }>
              {authorUser?.photo_url && (
                <S.DesignerAvatar source={{uri: authorUser.photo_url}} />
              )}
              <S.DesignerName>{author.name}</S.DesignerName>
              <MCIcon name="chevron-right" size={16} color="#999" />
            </S.DesignerRow>
          )}

          {infoRows.length > 0 && (
            <>
              <S.SectionTitle>도안 정보</S.SectionTitle>
              {infoRows.map(row => (
                <S.InfoRow key={row.label}>
                  <S.InfoLabel>{row.label}</S.InfoLabel>
                  <S.InfoValue>{row.value}</S.InfoValue>
                </S.InfoRow>
              ))}
            </>
          )}

          {tags.length > 0 && (
            <S.TagsRow>
              {tags.map((tag: any) => (
                <S.Tag key={tag.id}>
                  <S.TagText>{tag.permalink}</S.TagText>
                </S.Tag>
              ))}
            </S.TagsRow>
          )}

          {pattern.notes && (
            <>
              <S.SectionTitle>설명</S.SectionTitle>
              <S.NotesCard>
                <S.Description numberOfLines={4}>{pattern.notes}</S.Description>
                <S.ReadMoreButton
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate(EXPLORE_ROUTES.PATTERN_NOTES, {
                      notes: pattern.notes,
                      patternName: pattern.name,
                    })
                  }>
                  <S.ReadMoreButtonText>전체 보기</S.ReadMoreButtonText>
                </S.ReadMoreButton>
              </S.NotesCard>
            </>
          )}

{yarnPacks.length > 0 && (
            <>
              <S.SectionTitle>실 추천</S.SectionTitle>
              <S.YarnIdeasRow>
                {yarnPacks.map((pack: any) => {
                  const detail = yarnIdeas.find((y: any) => y.id === pack.yarn_id);
                  const photoUrl =
                    detail?.photos?.[0]?.medium_url ?? detail?.photos?.[0]?.square_url;
                  const yarnUrl = pack.yarn?.permalink
                    ? `https://www.ravelry.com/yarns/library/${pack.yarn.permalink}`
                    : undefined;
                  return (
                    <S.YarnCard
                      key={pack.id}
                      activeOpacity={0.7}
                      disabled={!yarnUrl}
                      onPress={() => yarnUrl && Linking.openURL(yarnUrl)}>
                      {photoUrl && <S.YarnImage source={{uri: photoUrl}} />}
                      <S.YarnName numberOfLines={1} selectable>
                        {pack.yarn?.name}
                      </S.YarnName>
                      <S.YarnCompany numberOfLines={1} selectable>
                        {pack.yarn?.yarn_company_name}
                      </S.YarnCompany>
                    </S.YarnCard>
                  );
                })}
              </S.YarnIdeasRow>
            </>
          )}

          {!pattern.free && pattern.price && (
            <>
              <S.SectionTitle>가격</S.SectionTitle>
              <S.PriceSection>
                <S.PriceMain>
                  {pattern.currency_symbol ?? '$'}
                  {pattern.price} ({pattern.currency})
                </S.PriceMain>
                <View ref={infoIconRef} collapsable={false}>
                  <TouchableOpacity onPress={openPriceInfo} hitSlop={8}>
                    <MCIcon name="information-outline" size={16} color="#999" />
                  </TouchableOpacity>
                </View>
              </S.PriceSection>
              {krwAmount != null && (
                <S.PriceKRW>≈ ₩{Math.round(krwAmount).toLocaleString()}</S.PriceKRW>
              )}
            </>
          )}

          {downloadUrl && (
            <S.DownloadButton
              activeOpacity={0.8}
              onPress={() => Linking.openURL(downloadUrl)}>
              <S.DownloadButtonText>
                {pattern.free
                  ? 'Ravelry 에서 무료로 받기'
                  : `Ravelry 에서 구매하기`}
              </S.DownloadButtonText>
            </S.DownloadButton>
          )}
        </S.Content>
      </ScrollView>

      <Modal
        transparent
        visible={priceInfoVisible}
        animationType="fade"
        onRequestClose={() => setPriceInfoVisible(false)}>
        <Pressable style={{flex: 1}} onPress={() => setPriceInfoVisible(false)}>
          <View
            style={{
              position: 'absolute',
              bottom: priceInfoPosition.bottom,
              left: priceInfoPosition.left,
              width: PRICE_INFO_WIDTH,
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 14,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}>
            <Text style={{fontSize: 11, color: '#999', marginBottom: 3}}>디자이너 표기 가격</Text>
            <Text style={{fontSize: 15, fontWeight: '700', color: '#191919', marginBottom: 10}}>
              {pattern.currency_symbol}
              {pattern.price} ({pattern.currency})
            </Text>
            {krwAmount != null && (
              <>
                <Text style={{fontSize: 11, color: '#999', marginBottom: 3}}>
                  한화로 약
                </Text>
                <Text
                  style={{fontSize: 15, fontWeight: '700', color: '#191919', marginBottom: 10}}>
                  ≈ ₩{Math.round(krwAmount).toLocaleString()}
                </Text>
              </>
            )}
            {fxRate != null && fxDate && (
              <Text style={{fontSize: 11, color: '#999', marginBottom: 6}}>
                1 {pattern.currency} = {fxRate.toFixed(2)} KRW ({fxDate} 기준)
              </Text>
            )}
            <Text style={{fontSize: 11, color: '#bbb'}}>환율 변환은 대략적인 값이에요.</Text>
          </View>
        </Pressable>
      </Modal>
    </S.Container>
  );
}
