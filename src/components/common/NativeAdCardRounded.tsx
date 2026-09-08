import React from 'react';
import Icon from 'react-native-vector-icons/Feather';
import {
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import useNativeAd from '@/hooks/useNativeAd';
import * as S from './NativeAdCardRounded.style';

// 둥근 테두리 카드 스타일의 네이티브 광고 — 검색 화면의 "뜨개함에 많이
// 저장됐어요" 리스트나 게시물/프로젝트 상세처럼 카드형 콘텐츠 사이에 자연스럽게 녹아듦
const NativeAdCardRounded = () => {
  const nativeAd = useNativeAd();

  if (!nativeAd) return null;

  return (
    <NativeAdView nativeAd={nativeAd}>
      <S.Card>
        <S.Left>
          <S.BadgeRow>
            <S.SponsoredBadge>
              <S.SponsoredText>광고</S.SponsoredText>
            </S.SponsoredBadge>
            {!!nativeAd.advertiser && (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <S.Advertiser numberOfLines={1}>
                  {nativeAd.advertiser}
                </S.Advertiser>
              </NativeAsset>
            )}
          </S.BadgeRow>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <S.Headline numberOfLines={1}>{nativeAd.headline}</S.Headline>
          </NativeAsset>
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <S.CtaText numberOfLines={1}>{nativeAd.callToAction}</S.CtaText>
          </NativeAsset>
        </S.Left>
        <S.Right>
          <S.MediaWrapper>
            <NativeMediaView
              resizeMode="cover"
              style={{width: '100%', height: '100%'}}
            />
          </S.MediaWrapper>
          <Icon name="chevron-right" size={16} color="#ccc" />
        </S.Right>
      </S.Card>
    </NativeAdView>
  );
};

export default NativeAdCardRounded;
