import styled from '@emotion/native';
import {Platform} from 'react-native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

export const PhotoImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const PhotoWrapper = styled.View`
  position: relative;
`;

export const PageIndicator = styled.View`
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.55);
`;

export const PageIndicatorText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #fff;
`;

export const Content = styled.View`
  padding: 16px;
`;

export const TitleRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const Title = styled.Text`
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: #191919;
`;

export const PriceSection = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const PriceMain = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #191919;
`;

export const PriceKRW = styled.Text`
  font-size: 13px;
  color: #999;
  margin-top: 2px;
`;

export const DesignerRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

export const DesignerAvatar = styled.Image`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #eee;
`;

export const DesignerName = styled.Text`
  font-size: 14px;
  color: #666;
`;

export const RatingSection = styled.View`
  gap: 14px;
  flex-direction: row;
`;

export const RatingBlock = styled.View`
  align-items: center;
   flex-direction: row;
   gap: 4px;
`;

export const RatingLabel = styled.Text`
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background-color: #191919;
  padding: 3px 8px;
  border-radius: 8px;
  overflow: hidden;
`;

export const RatingValueRow = styled.View`
  flex-direction: row;
  align-items: flex-end;
`;

export const RatingValue = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #191919;
`;

export const RatingValueUnit = styled.Text`
  font-size: 14px;
  color: #999;
  //margin-bottom: 3px;
`;

export const StarsRow = styled.View`
  flex-direction: row;
  gap: 2px;
  margin-top: 4px;
`;

export const SectionTitle = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #191919;
  margin-top: 32px;
  margin-bottom: 10px;
`;

export const InfoRow = styled.View`
  flex-direction: row;
  padding: 8px 0;
`;

export const InfoLabel = styled.Text`
  width: 90px;
  font-size: 13px;
  color: #999;
`;

export const InfoValue = styled.Text`
  flex: 1;
  font-size: 13px;
  color: #333;
`;

export const YarnIdeasRow = styled.View`
  flex-direction: row;
  gap: 10px;
`;

export const YarnCard = styled.TouchableOpacity`
  flex: 1;
`;

export const YarnImage = styled.Image`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  background-color: #eee;
  margin-bottom: 6px;
`;

export const YarnName = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #191919;
`;

export const YarnCompany = styled.Text`
  font-size: 11px;
  color: #999;
  margin-top: 1px;
`;

export const TagsRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

export const Tag = styled.View`
  padding: 4px 10px;
  border-radius: 12px;
  background-color: #f5f5f5;
`;

export const TagText = styled.Text`
  font-size: 12px;
  color: #666;
`;

export const Description = styled.Text`
  font-size: 14px;
  line-height: 21px;
  color: #444;
`;

export const NotesCard = styled.View`
  padding: 14px;
  border-radius: 10px;
  background-color: #f7f7f7;
`;

export const ReadMoreButton = styled.TouchableOpacity`
  align-self: flex-start;
  margin-top: 10px;
`;

export const ReadMoreButtonText = styled.Text`
  font-size: 13px;
  font-weight: 700;
  color: #191919;
`;

export const DownloadButton = styled.TouchableOpacity`
  margin-top: 24px;
  padding: 15px;
  border-radius: 10px;
  background-color: #191919;
  align-items: center;
`;

export const DownloadButtonText = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #fff;
`;

export const StatusText = styled.Text`
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 20px;
`;

export const DebugSectionLabel = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #666;
  padding: 12px 16px 4px;
`;

export const DebugBox = styled.ScrollView`
  background-color: #191919;
  margin: 0 16px 16px;
  border-radius: 8px;
  padding: 10px;
`;

export const DebugText = styled.Text`
  color: #9cff9c;
  font-size: 11px;
  font-family: ${Platform.OS === 'ios' ? 'Menlo' : 'monospace'};
`;
