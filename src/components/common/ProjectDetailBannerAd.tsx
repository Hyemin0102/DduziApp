import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import {fetchAdsEnabled} from '@/lib/adsConfig';

// TODO: 실제 배포 전에는 발급받은 배너 광고 단위 ID로 교체해야 함
const BANNER_AD_UNIT_ID = TestIds.BANNER;

// AdMob 배너 중 가장 작은 고정 크기(320x50)를 사용해 화면 차지 영역을 최소화
const ProjectDetailBannerAd = () => {
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
        alignItems: 'center',
        // paddingVertical: 8,
        // borderBottomWidth: 6,
        // borderBottomColor: '#f5f5f5',
      }}>
      <BannerAd unitId={BANNER_AD_UNIT_ID} size={BannerAdSize.BANNER} />
    </View>
  );
};

export default ProjectDetailBannerAd;
