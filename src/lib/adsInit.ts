import mobileAds from 'react-native-google-mobile-ads';

// 여기 등록된 기기는 실제 광고 단위 ID를 쓰는 release 빌드(TestFlight, 내부
// 테스트 등)에서도 항상 구글 테스트 광고만 받음 — 실수로 진짜 광고를 클릭해서
// 부정 클릭으로 잡히는 걸 막기 위함. 실제 기기 ID는 등록 전 첫 광고 요청 시
// 콘솔/로그캣에 "Use RequestConfiguration.Builder().setTestDeviceIds(...)"
// 형태로 찍히는 값을 그대로 추가하면 됨
const TEST_DEVICE_IDS = [
  'EMULATOR',
  '219ea586efc2ff70a19b9a28cdf28639', // Chloe의 iPhone
  '652BCECBDC3878D63670A4201C2204FD', // 안드로이드 테스트 기기
];

let initPromise: Promise<void> | null = null;

// React는 마운트 시 자식 컴포넌트의 useEffect를 부모보다 먼저 실행하기 때문에,
// App.tsx의 초기화 useEffect보다 화면(홈 피드 등)의 광고 요청이 먼저 나가버릴
// 수 있음 — 그러면 테스트 기기 등록이 적용되기 전에 첫 광고 요청이 나가서
// 등록된 기기에서도 실제 광고가 뜨는 문제가 생김. 그래서 광고를 요청하는
// 모든 곳(useNativeAd, BottomBannerAd 등)이 이 초기화가 끝나기를 먼저
// 기다리도록 공용 프라미스로 순서를 강제함
export function initAds(): Promise<void> {
  if (!initPromise) {
    initPromise = mobileAds()
      .setRequestConfiguration({testDeviceIdentifiers: TEST_DEVICE_IDS})
      .then(() => mobileAds().initialize())
      .then(() => undefined)
      .catch(error => {
        console.error('AdMob 초기화 실패:', error);
      });
  }
  return initPromise;
}
