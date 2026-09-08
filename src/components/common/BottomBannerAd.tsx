import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import {fetchAdsEnabled} from '@/lib/adsConfig';

// TODO: 실제 배포 전에는 발급받은 배너 광고 단위 ID로 교체해야 함
const BANNER_AD_UNIT_ID = TestIds.BANNER;

// 화면 하단에 고정되는 배너 — 스크롤 콘텐츠 밖에 둬서 스크롤해도 항상 보임
const BottomBannerAd = () => {
  const [adsEnabled, setAdsEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchAdsEnabled().then(enabled => {
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
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
};

export default BottomBannerAd;
