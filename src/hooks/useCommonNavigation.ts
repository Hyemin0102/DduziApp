import {useNavigation} from '@react-navigation/native';
import {RootStackNavigationProp} from '../@types/navigation';

/**
 * 공통 네비게이션 훅 (혼합 방식)
 *
 * @returns
 * - rootNavigation: 전역 네비게이션 (다른 탭으로 이동할 때 사용)
 * - navigation: 현재 스택 네비게이션 (같은 스택 내에서 이동할 때 사용)
 *
 * @example
 * const {rootNavigation, navigation} = useCommonNavigation();
 *
 * // 1. 같은 스택 내에서 이동 (간단한 방법 - 추천)
 * navigation.navigate(HOME_ROUTES.POST_DETAIL, {postId: '123'});
 *
 * // 2. 다른 탭으로 이동 (복잡하지만 탭 전환이 필요할 때)
 * rootNavigation.navigate(ROOT_ROUTES.TAB_NAVIGATOR, {
 *   screen: TAB_ROUTES.POST_TAB,
 *   params: {
 *     screen: POST_ROUTES.CREATE_POST
 *   }
 * });
 *
 * // 3. Root 레벨 이동 (로그인, 프로필 등)
 * rootNavigation.navigate(ROOT_ROUTES.AUTH);
 * rootNavigation.navigate(ROOT_ROUTES.PROFILE);
 */
export default function useCommonNavigation<T = any>() {
  const rootNavigation = useNavigation<RootStackNavigationProp>();
  const navigation = useNavigation<T>(); // 현재 스택의 네비게이션 (제네릭 타입)

  return {
    rootNavigation, // 전역 이동용 (탭 전환, Root 레벨)
    navigation, // 현재 스택 내 이동용 (간단한 이동)
  };
}
