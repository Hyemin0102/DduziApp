import React from 'react';
import {
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import useNativeAd from '@/hooks/useNativeAd';
import * as S from './NativeAdCard.style';

const NativeAdCard = () => {
  const nativeAd = useNativeAd();

  // 로드 실패/대기 중에는 피드에 빈 자리를 남기지 않고 그냥 아무것도 렌더링하지 않음
  if (!nativeAd) return null;

  return (
    <NativeAdView nativeAd={nativeAd}>
      <S.CardContainer>
        <S.Row>
          {/* AdMob 네이티브 광고 정책상 미디어(이미지/영상) 자산은 항상 표시해야
              해서, 아이콘이 있어도 대체하지 않고 미디어뷰를 그대로 노출함 */}
          <S.MediaWrapper>
            <NativeMediaView
              resizeMode="cover"
              style={{width: '100%', height: '100%'}}
            />
          </S.MediaWrapper>
          <S.TextSection>
            <S.HeadlineRow>
            <S.SponsoredBadge>
                <S.SponsoredText>광고</S.SponsoredText>
              </S.SponsoredBadge>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <S.Headline numberOfLines={1}>{nativeAd.headline}</S.Headline>
              </NativeAsset>
            </S.HeadlineRow>
            {!!(nativeAd.advertiser || nativeAd.body) && (
              <NativeAsset
                assetType={
                  nativeAd.advertiser
                    ? NativeAssetType.ADVERTISER
                    : NativeAssetType.BODY
                }>
                <S.Advertiser numberOfLines={1}>
                  {nativeAd.advertiser || nativeAd.body}
                </S.Advertiser>
              </NativeAsset>
            )}
          </S.TextSection>
        </S.Row>
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <S.CtaButton>
            <S.CtaText>{nativeAd.callToAction}</S.CtaText>
          </S.CtaButton>
        </NativeAsset>
      </S.CardContainer>
    </NativeAdView>
  );
};

export default NativeAdCard;
