import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #e5e5e5;
`;

export const HeaderTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #000;
`;

export const SubmitText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #0070f3;
`;

export const Section = styled.View`
  padding: 20px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
`;

export const Input = styled.TextInput`
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 15px;
  color: #000;
  background-color: #fafafa;
`;

export const TextArea = styled.TextInput`
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 15px;
  color: #000;
  background-color: #fafafa;
  //min-height: 100px;
`;

export const ImageSection = styled.View`
  margin-top: 8px;
`;

export const ImageUploadButton = styled.TouchableOpacity`
  width: 100px;
  height: 100px;
  border: 2px dashed #e5e5e5;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background-color: #fafafa;
`;

export const ImageUploadText = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
`;

export const ImagePreview = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  margin-right: 12px;
  position: relative;
  overflow: hidden;
`;

export const ImageRemoveButton = styled.TouchableOpacity`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  align-items: center;
  justify-content: center;
`;

export const ImageOrder = styled.Text`
  position: absolute;
  bottom: 4px;
  left: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

export const LabelRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const AddLogButton = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

export const AddLogText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #0070f3;
`;

export const LogItem = styled.View`
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background-color: #fafafa;
  margin-bottom: 12px;
`;

export const LogHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

export const LogNumber = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #0070f3;
`;

export const DateButton = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
`;

export const DateText = styled.Text`
  font-size: 14px;
  color: #666;
`;

export const LogInput = styled.TextInput`
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  color: #000;
  background-color: #fff;
  min-height: 80px;
`;

export const BottomSpace = styled.View`
  height: 40px;
`;
