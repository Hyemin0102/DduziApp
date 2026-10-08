export const SUPPORT_PRICE_LABEL = '4,400원';

// 결제 연결 전까지 응원하기 버튼을 비활성화해두는 플래그
export const SUPPORT_PAYMENT_ENABLED = false;

// 응원 유도 모달 노출 조건
// 기존 유저는 "이 버전을 처음 실행한 날"부터, 신규 유저는 가입일부터 기준일을 잡음
// TODO: 응원 기능이 실제로 포함된 배포 버전으로 교체할 것 (package.json의 version과 맞출 것)
export const SUPPORT_FEATURE_MIN_VERSION = '0.0.1';
export const SUPPORT_MODAL_BASELINE_WAIT_DAYS = 3;
export const SUPPORT_MODAL_STAGE2_GAP_DAYS = 30;
export const SUPPORT_MODAL_STAGE3_GAP_DAYS = 60;
export const SUPPORT_MODAL_MIN_APP_OPENS = 5;
export const SUPPORT_MODAL_MIN_POSTS = 3;
export const SUPPORT_MODAL_MIN_PROJECTS = 2;

export const getSupportMessage = (count: number): string => {
  if (count <= 0) return '뜨지가 마음에 드셨다면, 응원해주실래요?';
  if (count === 1) return '첫 응원 감사해요! 뜨지에게 큰 힘이 됩니다.';
  if (count === 2) return '두번째 응원, 뜨지는 힘이 나요!';
  if (count === 3) return '세번째 응원이에요. 뜨지는 무럭무럭 자라는 중!';
  if (count <= 7) return `${count}번의 응원 덕분에 뜨지는 운영되고 있어요!`;
  return `${count}번이나 응원해주셨네요. 뜨지와 오래 함께해주셔서 감사해요.`;
};

