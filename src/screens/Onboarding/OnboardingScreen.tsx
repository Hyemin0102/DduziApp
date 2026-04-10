import React, {useRef, useState} from 'react';
import {Animated, Button, PanResponder} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import * as S from './OnboardingScreen.style';
import AsyncStorage from '@react-native-async-storage/async-storage';

const slides = [
  {
    headline: '오늘 뭐 뜨지?',
    description:
      '뜨지는 뜨개를 좋아하는 사람들이\n조용히 모인 공간이에요.\n뜨지를 구경하다 보면 어느새 손이 근질거릴 거예요.',
  },
  {
    headline: '문어발 뜨개인이신가요?',
    description:
      '실, 바늘, 도안, 데일리 뜨개 기록, 게시물까지\n하나의 프로젝트에서 관리해요.\n프로젝트가 많아도 문제없어요.',
  },
  {
    headline: '완성했으면 자랑해야죠!',
    description:
      '자유롭게 뜨개 게시물을 올려 내 피드를 꾸며봐요.\n좋아요, 댓글 말고 내 작품 자랑만 해요.',
  },
];

const OnboardingScreen = () => {
  const {completeOnboarding} = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  console.log('온보딩인덱스',currentIndex);
  

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
          <S.Description>{slide.description}</S.Description>
          {currentIndex === slides.length - 1 && (
            <S.ReadyText>자, 이제 뜨러 가볼까요?</S.ReadyText>
          )}
        </S.ContentArea>

        <S.BottomArea>
          <S.Pagination>
            {slides.map((_, i) => (
              <S.Dot key={i} active={i === currentIndex} />
            ))}
          </S.Pagination>
          <S.ActionButton onPress={completeOnboarding}>
            <S.ActionButtonText>뜨지 시작하기</S.ActionButtonText>
          </S.ActionButton>
          <Button title="온보딩 초기화" onPress={() => AsyncStorage.removeItem('onboarding_completed')} />

        </S.BottomArea>
      </S.GestureView>
    </S.Container>
  );
};

export default OnboardingScreen;
