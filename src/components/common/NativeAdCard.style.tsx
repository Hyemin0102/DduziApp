import styled from '@emotion/native';

// AdMob 네이티브 광고 정책: MediaView가 동영상 소재를 받으려면 최소
// 120x120(dp/pt)이어야 함
const MEDIA_SIZE = 120;

export const CardContainer = styled.View`
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #efefef;
  padding: 12px;
`;

export const Row = styled.View`
  flex-direction: row;
  gap: 10px;
`;

export const MediaWrapper = styled.View`
  width: ${`${MEDIA_SIZE}px`};
  height: ${`${MEDIA_SIZE}px`};
  border-radius: 10px;
  overflow: hidden;
  background-color: #f1f1ef;
`;

export const MediaImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const TextSection = styled.View`
  flex: 1;
  justify-content: center;
`;

export const HeadlineRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const Headline = styled.Text`
  font-weight: 600;
  font-size: 14px;
  color: #191919;
  flex: 1;
`;

export const Advertiser = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 3px;
`;

export const SponsoredBadge = styled.View`
  background-color: transparent;
  border-width: 1px;
  border-color: #767676;
  padding-horizontal: 6px;
  padding-vertical: 1px;
  border-radius: 4px;
`;

export const SponsoredText = styled.Text`
  font-size: 10px;
  color: #555;
  font-weight: 700;
`;

export const CtaButton = styled.View`
  margin-top: 10px;
  padding-vertical: 10px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: #191919;
`;

export const CtaText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;
