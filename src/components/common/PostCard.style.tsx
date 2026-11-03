import styled from '@emotion/native';
import {Dimensions} from 'react-native';
import FastImage from 'react-native-fast-image';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const IMAGE_HEIGHT = Math.min(SCREEN_WIDTH, 500);

export const CardContainer = styled.View`
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #efefef;
  padding-top: 6px;
  padding-bottom: 10px;
`;

export const ProfileSection = styled.TouchableOpacity`
  flex-direction: row;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
`;

export const ProfileImage = styled(FastImage)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border-width: 1px;
  border-color: #e9e9e7;
`;

export const ProfileImagePlaceholder = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f1f1ef;
  justify-content: center;
  align-items: center;
`;

export const ProfileImagePlaceholderText = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #191919;
`;

export const UsernameRow = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

export const Username = styled.Text`
  font-weight: 600;
  font-size: 14px;
  color: #191919;
  flex-shrink: 1;
`;

export const ImageCarouselWrapper = styled.View`
  width: 100%;
  height: ${`${IMAGE_HEIGHT}px`};
  position: relative;
`;

export const ImageContainer = styled.View`
  width: ${`${SCREEN_WIDTH}px`};
  height: ${`${IMAGE_HEIGHT}px`};
`;

export const PostImage = styled(FastImage)`
  width: 100%;
  height: 100%;
`;

export const ImagePlaceholder = styled.View`
  width: 100%;
  height: 100%;
  background-color: #f1f1ef;
`;

export const ImageCounter = styled.View`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.55);
  padding: 4px 10px;
  border-radius: 12px;
`;

export const ImageCounterText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 600;
`;

export const DotsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 5px;
  padding-top: 8px;
`;

export const Dot = styled.View<{active: boolean}>`
  width: ${({active}) => (active ? 6 : 5)}px;
  height: ${({active}) => (active ? 6 : 5)}px;
  border-radius: 3px;
  background-color: ${({active}) => (active ? '#191919' : '#d4d4d4')};
`;

// 좋아요/댓글 버튼(BadgeRow)을 이 안에 중첩시키면 hitSlop을 아무리 키워도 안드로이드에서
// 가끔 바깥쪽(게시물 상세 이동) 터치로 새는 레이스가 남아서, BadgeRow를 이 터치 영역
// 밖(형제 요소)으로 완전히 분리함 — 패딩은 둘을 감싸는 CardBody가 가짐
export const CardBody = styled.View`
  padding: 10px 12px 14px;
`;

export const ContentSection = styled.TouchableOpacity``;

// Android에서 flex-wrap + margin-left: auto 조합으로 오른쪽 정렬된 터치 영역이
// 줄바꿈 시 실제 보이는 위치와 어긋나는 버그가 있어서(완료 상태처럼 제목+뱃지
// 길이 조합으로 줄바꿈이 생기면 좋아요/댓글 탭이 게시물 상세로 새는 문제로
// 나타남), 뱃지 그룹과 액션바를 구조적으로 분리 — 이 Row 자체는 줄바꿈 없이
// space-between으로만 정렬하고, 줄바꿈은 안쪽 BadgeGroup에서만 일어나게 함
export const BadgeRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const BadgeGroup = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex-shrink: 1;
`;

export const ProjectBadge = styled.View`
  background-color: #f1f1ef;
  padding-horizontal: 8px;
  padding-vertical: 3px;
  border-radius: 10px;
  max-width: 160px;
  flex-shrink: 1;
  justify-content: center;
`;

export const ProjectBadgeText = styled.Text`
  font-size: 12px;
  color: #191919;
  font-weight: 600;
`;

export const StatusBadge = styled.View<{status: 'planned' | 'in_progress' | 'completed'}>`
  background-color: ${({status}) => {
    switch (status) {
      case 'planned':
        return '#ede7f6';
      case 'completed':
        return '#e8f5e9';
      default:
        return '#fff8e1';
    }
  }};
  padding-horizontal: 8px;
  padding-vertical: 3px;
  border-radius: 10px;
  justify-content: center;
`;

export const StatusBadgeText = styled.Text<{status: 'planned' | 'in_progress' | 'completed'}>`
  font-size: 12px;
  color: ${({status}) => {
    switch (status) {
      case 'planned':
        return '#7e57c2';
      case 'completed':
        return '#4CAF50';
      default:
        return '#f59e0b';
    }
  }};
  font-weight: 600;
`;

// 좋아요/댓글 액션 바 — BadgeRow 맨 오른쪽에 붙음(PostDetailScreen과 동일 톤)
export const ActionBar = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const ActionButton = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

export const ActionTouch = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 2px;
`;

// 하트 버스트 파티클이 겹쳐 뜰 기준 위치(좋아요 아이콘 중심)
export const LikeIconWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

export const ActionButtonText = styled.Text`
  font-size: 12px;
  color: #000;
  font-weight: 600;
`;

export const Content = styled.Text`
  font-size: 14px;
  color: #191919;
  line-height: 20px;
  margin-bottom: 6px;
  word-break: keep-all;
`;

export const Date = styled.Text`
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
`;

export const More = styled.Text`
  font-size: 14px;
  color: #999;
  margin-bottom: 4px;
`;
