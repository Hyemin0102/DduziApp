import {useEffect, useState} from 'react';
import {NativeAd, TestIds} from 'react-native-google-mobile-ads';
import {fetchAdsEnabled} from '@/lib/adsConfig';

// TODO: 실제 배포 전에는 발급받은 네이티브 광고 단위 ID로 교체해야 함
const NATIVE_AD_UNIT_ID = TestIds.NATIVE;

const useNativeAd = () => {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    let isMounted = true;
    let loadedAd: NativeAd | null = null;

    fetchAdsEnabled().then(enabled => {
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
