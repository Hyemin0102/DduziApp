import styled from '@emotion/native';

export const Container = styled.ScrollView`
  flex: 1;
  background-color: #fff;
`;

export const Section = styled.View`
  padding: 24px 20px;
`;

export const Title = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #191919;
  margin-bottom: 12px;
`;

export const Body = styled.Text`
  font-size: 14px;
  color: #444;
  line-height: 22px;
`;

export const BulletRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 10px;
`;

export const BulletDot = styled.Text`
  font-size: 14px;
  color: #999;
  line-height: 22px;
`;

export const BadgeShowcase = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
  row-gap: 24px;
  margin-top: 24px;
`;

export const BadgeItem = styled.View`
  align-items: center;
  gap: 8px;
`;

export const BadgeItemLabel = styled.Text`
  font-size: 13px;
  color: #666;
  margin-top: 10px;
  //border: 1px solid red;
`;

export const AvatarPreview = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 48px;
  background-color: #f1f1ef;
`;

export const Hero = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const HeroTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #191919;
  margin-top: 20px;
`;

export const HeroCount = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #666;
  margin-top: 8px;
`;

export const HeroMessage = styled.Text`
  font-size: 15px;
  color: #444;
  line-height: 22px;
  text-align: center;
  margin-top: 10px;
  padding-horizontal: 24px;
`;

export const ToggleCard = styled.View`
  margin: 24px 20px;
  padding: 16px;
  border-radius: 12px;
  background-color: #f7f7f7;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const ToggleTextColumn = styled.View`
  flex: 1;
  padding-right: 12px;
`;

export const ToggleTitle = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #191919;
`;

export const ToggleSubText = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 2px;
`;
