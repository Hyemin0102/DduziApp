import React, {useRef, useState} from 'react';
import {Animated, PanResponder, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {RootStackNavigationProp} from '../../@types/navigation';
import {ROOT_ROUTES} from '../../constants/navigation.constant';
// import {useAuth} from '../../contexts/AuthContext';
import * as S from './OnboardingScreen.style';

interface SlideImage {
  source: ReturnType<typeof require>;
  width: number;
  aspectRatio: number;
  marginTop?: number;
}

interface Slide {
  headline: string;
  description1: string;
  description2: string;
  image: SlideImage;
}

const slides: Slide[] = [
  {
    headline: '오늘 뭐 뜨지?',
    description1: '뜨지는 뜨개를 좋아하는 사람들이\n조용히 모인 공간이에요.',
    description2: '뜨지를 구경하다보면\n어느새 손이 근질거릴거예요.',
    image: {
      source: require('../../assets/images/1_onboarding.png'),
      width: 431,
      aspectRatio: 431.37 / 335.5,
      //marginTop: 40,
    },
  },
  {
    headline: '문어발 뜨개인이신가요?',
    description1: '실, 바늘, 도안, 데일리 뜨개 기록, 게시물까지\n하나의 프로젝트에서 관리해요.',
    description2: '프로젝트가 많아도 뜨개를\n즐기는 데는 문제없어요.',
    image: {
      source: require('../../assets/images/2_onboarding.png'),
      width: 375,
      aspectRatio: 375 / 259.63,
    },
  },
  {
    headline: '완성했으면 자랑해야죠!',
    description1: '좋아요, 댓글이 사라진 피드에\n사람들의 반응 걱정없이 내작품 자랑만 해요.',
    description2: '자, 이제 뜨지를 시작해볼까요?',
    image: {
      source: require('../../assets/images/3_onboarding.png'),
      width: 260,
      aspectRatio: 536 / 750,
      //marginTop: 20,
    },
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  // const {completeOnboarding} = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  const transitionToSlide = (nextIndex: number) => {
    if (isTransitioning.current) return;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    isTransitioning.current = true;
    currentIndexRef.current = nextIndex;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIndex);
      isTransitioning.current = false;
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, {dx, dy}) =>
        Math.abs(dx) > 8 && Math.abs(dy) < 40,
      onPanResponderRelease: (_, {dx}) => {
        if (dx < -50) transitionToSlide(currentIndexRef.current + 1);
        else if (dx > 50) transitionToSlide(currentIndexRef.current - 1);
      },
    }),
  ).current;

  const slide = slides[currentIndex];

  return (
    <S.Container>
      <S.GestureView {...panResponder.panHandlers}>
        <S.ContentArea style={{opacity: fadeAnim}}>
          <S.Headline>{slide.headline}</S.Headline>
          <View style={{gap:18}}>
            <S.Description>{slide.description1}</S.Description>
            <S.Description>{slide.description2}</S.Description>
          </View>
          <View style={{flex: 1, marginTop: slide.image.marginTop}}>
            <S.SlideImage
              source={slide.image.source}
              style={{width: slide.image.width, height: undefined, aspectRatio: slide.image.aspectRatio}}
              resizeMode="contain"
            />
          </View>
        </S.ContentArea>

        <S.BottomArea>
          <S.Pagination>
            {slides.map((_, i) => (
              <S.Dot key={i} active={i === currentIndex} />
            ))}
          </S.Pagination>
          <S.ActionButton onPress={() => navigation.navigate(ROOT_ROUTES.AUTH as any)}>
            <S.ActionButtonText>뜨지 시작하기</S.ActionButtonText>
          </S.ActionButton>
        </S.BottomArea>
      </S.GestureView>
    </S.Container>
  );
};

export default OnboardingScreen;
