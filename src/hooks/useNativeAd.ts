import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {NativeAd, TestIds} from 'react-native-google-mobile-ads';
import {fetchAdsEnabled} from '@/lib/adsConfig';
import {initAds} from '@/lib/adsInit';

// 개발 중(__DEV__)에는 실수로 자기 광고를 클릭하는 부정 클릭 위험을 막기 위해
// 항상 구글 테스트 광고 단위를 쓰고, 실제 배포 빌드에서만 발급받은 광고 단위를 씀
const NATIVE_AD_UNIT_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({
      ios: 'ca-app-pub-1320864987524138/9351939469',
      android: 'ca-app-pub-1320864987524138/4921739868',
      default: TestIds.NATIVE,
    });

const useNativeAd = () => {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    let isMounted = true;
    let loadedAd: NativeAd | null = null;

    initAds()
      .then(() => fetchAdsEnabled())
      .then(enabled => {
        if (!enabled || !isMounted) return;

        NativeAd.createForAdRequest(NATIVE_AD_UNIT_ID)
          .then(ad => {
            if (!isMounted) {
              ad.destroy();
              return;
            }
            loadedAd = ad;
            setNativeAd(ad);
          })
          .catch(error => {
            console.error('네이티브 광고 로드 실패:', error);
          });
      });

    return () => {
      isMounted = false;
      loadedAd?.destroy();
    };
  }, []);

  return nativeAd;
};

export default useNativeAd;
