import {
  initConnection,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  isUserCancelledError,
  type Purchase,
} from 'react-native-iap';
import {supabase} from './supabase';
import {SUPPORT_PRODUCT_ID} from '@/constants/support.constant';

let isConnected = false;

async function ensureConnected() {
  if (isConnected) return;
  const connected = await initConnection();
  if (!connected) throw new Error('스토어 연결에 실패했어요.');
  isConnected = true;
}

interface PurchaseSupportResult {
  supporter_level: 1 | 2 | 3 | null;
  supporter_count: number;
}

// 응원 상품(dduzi_support_single) 구매 1회 전체 플로우 —
// 결제창 띄우기 → 결제 결과 이벤트 대기 → 서버 검증 → 거래 완료 처리까지 하나의 async 함수로 감쌈
// (react-native-iap은 이벤트 기반 API라서, 버튼 하나로 끝나는 단순 구매에는 이렇게 Promise로
// 감싸는 게 호출하는 쪽 코드가 간단해짐)
export async function purchaseSupport(): Promise<PurchaseSupportResult> {
  await ensureConnected();

  return new Promise<PurchaseSupportResult>((resolve, reject) => {
    let updateSub: {remove(): void} | undefined;
    let errorSub: {remove(): void} | undefined;
    const cleanup = () => {
      updateSub?.remove();
      errorSub?.remove();
    };

    const handlePurchase = async (purchase: Purchase) => {
      if (purchase.productId !== SUPPORT_PRODUCT_ID) return;
      try {
        const isApple = purchase.store === 'apple';
        const transactionId = isApple ? purchase.transactionId : purchase.purchaseToken;
        if (!transactionId) throw new Error('거래 정보를 확인할 수 없어요.');

        const {data, error} = await supabase.functions.invoke('verify-supporter-purchase', {
          body: {
            store: isApple ? 'app_store' : 'google_play',
            productId: purchase.productId,
            transactionId,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // 검증이 끝난 거래만 완료 처리 — 실패 시 finishTransaction을 안 불러야
        // 다음 앱 실행/getAvailablePurchases에서 다시 검증을 시도할 수 있음
        await finishTransaction({purchase, isConsumable: true});

        cleanup();
        resolve({
          supporter_level: data?.supporter_level ?? null,
          supporter_count: data?.supporter_count ?? 0,
        });
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    updateSub = purchaseUpdatedListener(purchase => {
      void handlePurchase(purchase);
    });
    errorSub = purchaseErrorListener(error => {
      cleanup();
      if (isUserCancelledError(error)) {
        // 사용자가 결제창에서 그냥 취소한 거라 "오류"가 아님 — 호출하는 쪽에서
        // error.code로 구분해서 에러 알럿을 안 띄우게 함
        const cancelError = new Error('User cancelled purchase');
        (cancelError as Error & {code?: string}).code = 'USER_CANCELLED';
        reject(cancelError);
        return;
      }
      reject(new Error(error.message));
    });

    requestPurchase({
      request: {
        apple: {sku: SUPPORT_PRODUCT_ID},
        google: {skus: [SUPPORT_PRODUCT_ID]},
      },
      type: 'in-app',
    }).catch(error => {
      cleanup();
      if (isUserCancelledError(error)) {
        const cancelError = new Error('User cancelled purchase');
        (cancelError as Error & {code?: string}).code = 'USER_CANCELLED';
        reject(cancelError);
        return;
      }
      reject(error);
    });
  });
}
