import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import {fetchAdsEnabled} from '@/lib/adsConfig';
import {initAds} from '@/lib/adsInit';

// 개발 중(__DEV__)에는 실수로 자기 광고를 클릭하는 부정 클릭 위험을 막기 위해
// 항상 구글 테스트 광고 단위를 쓰고, 실제 배포 빌드에서만 발급받은 광고 단위를 씀
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: 'ca-app-pub-1320864987524138/5604266149',
      android: 'ca-app-pub-1320864987524138/4813928657',
      default: TestIds.BANNER,
    });

// 화면 하단에 고정되는 배너 — 스크롤 콘텐츠 밖에 둬서 스크롤해도 항상 보임
const BottomBannerAd = () => {
  const [adsEnabled, setAdsEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    initAds()
      .then(() => fetchAdsEnabled())
      .then(enabled => {
        if (isMounted) setAdsEnabled(enabled);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!adsEnabled) return null;

  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#efefef',
      }}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
      />
    </View>
  );
};

export default BottomBannerAd;
