import React, {useEffect, useMemo} from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';

const PARTICLE_COUNT = 6;
// liked.svg 하트 채우기색(#F5D6D6)과 같은 톤으로 맞춘 팔레트
const COLORS = ['#F1C3C3', '#F5D6D6', '#F8E2E2', '#FBEFEF'];

interface ParticleConfig {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

function generateParticles(): ParticleConfig[] {
  return Array.from({length: PARTICLE_COUNT}, (_, i) => ({
    // 위쪽 반원 방향으로만 퍼지게(-160~-20도), 완전 랜덤이면 아래로도 튀어서 어색함
    angle: -160 + Math.random() * 140,
    distance: 26 + Math.random() * 22,
    size: 8 + Math.random() * 7,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 60,
  }));
}

function Particle({config}: {config: ParticleConfig}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, {duration: 480, easing: Easing.out(Easing.quad)}),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const rad = (config.angle * Math.PI) / 180;
    const tx = Math.cos(rad) * config.distance * progress.value;
    const ty = Math.sin(rad) * config.distance * progress.value;
    return {
      transform: [
        {translateX: tx},
        {translateY: ty},
        {scale: 0.3 + progress.value * 0.9},
      ],
      opacity: 1 - progress.value,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -config.size / 2,
          marginLeft: -config.size / 2,
        },
        animatedStyle,
      ]}>
      <FA5Icon name="heart" solid size={config.size} color={config.color} />
    </Animated.View>
  );
}

// 좋아요를 누르는 순간 하트 조각이 위쪽으로 흩날리는 1회성 이펙트.
// burstKey가 바뀔 때마다 새로 마운트되어 처음부터 재생됨(언마운트는 하지 않음 — 비용이 작아 방치해도 무해함)
export default function LikeBurst() {
  const particles = useMemo(generateParticles, []);
  return (
    <>
      {particles.map((p, i) => (
        <Particle key={i} config={p} />
      ))}
    </>
  );
}
