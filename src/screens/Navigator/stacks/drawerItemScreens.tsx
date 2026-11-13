import React from 'react';
import YarnRavelrySearchScreen from '@/screens/Drawer/YarnRavelrySearchScreen';
import YarnFormScreen from '@/screens/Drawer/YarnFormScreen';
import YarnDetailScreen from '@/screens/Drawer/YarnDetailScreen';
import YarnColorwayScreen from '@/screens/Drawer/YarnColorwayScreen';
import NeedleFormScreen from '@/screens/Drawer/NeedleFormScreen';
import NeedleDetailScreen from '@/screens/Drawer/NeedleDetailScreen';
import {DRAWER_ROUTES} from '@/constants/navigation.constant';

// 서랍장 실/바늘 화면 묶음
// 서랍장 탭 + 프로젝트 상세가 있는 스택(프로젝트/홈/게시물)에 공통 등록 —
// 프로젝트 상세에서 연결된 실/바늘 보기, "서랍에 새로 추가"를 같은 스택 안에서 처리하기 위함
const drawerItemScreens = (Stack: any) => (
  <>
    <Stack.Screen
      name={DRAWER_ROUTES.YARN_RAVELRY_SEARCH}
      component={YarnRavelrySearchScreen}
      options={{title: 'Ravelry 에서 가져오기'}}
    />
    <Stack.Screen name={DRAWER_ROUTES.YARN_FORM} component={YarnFormScreen} options={{title: '실 추가'}} />
    <Stack.Screen
      name={DRAWER_ROUTES.YARN_COLORWAY}
      component={YarnColorwayScreen}
      options={{title: '색상 선택'}}
    />
    <Stack.Screen name={DRAWER_ROUTES.YARN_DETAIL} component={YarnDetailScreen} options={{title: '실 정보'}} />
    <Stack.Screen
      name={DRAWER_ROUTES.NEEDLE_FORM}
      component={NeedleFormScreen}
      options={{title: '바늘 추가'}}
    />
    <Stack.Screen
      name={DRAWER_ROUTES.NEEDLE_DETAIL}
      component={NeedleDetailScreen}
      options={{title: '바늘 정보'}}
    />
  </>
);

export default drawerItemScreens;
