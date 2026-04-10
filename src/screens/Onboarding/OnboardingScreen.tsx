import React, {useEffect, useRef, useState} from 'react';
import {Animated} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import * as S from './OnboardingScreen.style';

const SLIDE_DURATION = 3500;

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
  const progressAnims = useRef(slides.map(() => new Animated.Value(0))).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const transitionToSlide = (nextIndex: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    // Reset bars: past = full, future = empty
    progressAnims.forEach((anim, i) => {
      if (i < currentIndex) {
        anim.setValue(1);
      } else if (i > currentIndex) {
        anim.setValue(0);
      }
    });

    // Animate current bar
    progressAnims[currentIndex].setValue(0);
    progressAnimRef.current = Animated.timing(progressAnims[currentIndex], {
      toValue: 1,
      duration: SLIDE_DURATION,
      useNativeDriver: false,
    });

    progressAnimRef.current.start(({finished}) => {
      if (finished && currentIndex < slides.length - 1) {
        transitionToSlide(currentIndex + 1);
      }
    });

    return () => {
      progressAnimRef.current?.stop();
    };
  }, [currentIndex]);

  const slide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <S.Container>
      <S.ProgressBarSection>
        {slides.map((_, i) => (
          <S.ProgressBarTrack key={i}>
            <S.ProgressBarFill
              style={{
                width: progressAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </S.ProgressBarTrack>
        ))}
      </S.ProgressBarSection>

      <S.ContentArea style={{opacity: fadeAnim}}>
        <S.Headline>{slide.headline}</S.Headline>
        <S.Description>{slide.description}</S.Description>
      </S.ContentArea>

      <S.BottomArea>
        {isLastSlide && (
          <>
            <S.ReadyText>자, 이제 뜨러 가볼까요?</S.ReadyText>
            <S.ActionButton onPress={completeOnboarding}>
              <S.ActionButtonText>뜨지 시작하기</S.ActionButtonText>
            </S.ActionButton>
          </>
        )}
      </S.BottomArea>
    </S.Container>
  );
};

export default OnboardingScreen;
