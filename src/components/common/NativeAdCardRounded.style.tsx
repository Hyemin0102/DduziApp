import styled from '@emotion/native';

export const Card = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-width: 1px;
  border-color: #eeeeee;
  border-radius: 14px;
  padding: 14px;
  margin-horizontal: 20px;
  margin-bottom: 10px;
`;

export const Left = styled.View`
  flex: 1;
  margin-right: 12px;
`;

export const BadgeRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
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

export const Advertiser = styled.Text`
  font-size: 12px;
  color: #666;
  flex-shrink: 1;
`;

export const Headline = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
`;

export const CtaText = styled.Text`
  font-size: 12px;
  color: #767676;
`;

export const Right = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

// AdMob 네이티브 광고 정책: MediaView가 동영상 소재를 받으려면 최소
// 120x120(dp/pt)이어야 함
export const MediaWrapper = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  background-color: #f0f0f0;
`;
