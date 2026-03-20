import styled from '@emotion/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

export const HeaderTitle = styled.Text`
  font-size: 17px;
  font-weight: 600;
  color: #111;
`;

export const SubmitButton = styled.TouchableOpacity``;

export const SubmitText = styled.Text<{disabled?: boolean}>`
  font-size: 16px;
  font-weight: 600;
  color: ${({disabled}) => (disabled ? '#bbb' : '#191919')};
`;

export const Section = styled.View`
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 10px;
`;

export const ProjectSelector = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  padding: 12px 14px;
`;

export const ProjectSelectorText = styled.Text<{placeholder?: boolean}>`
  font-size: 15px;
  color: ${({placeholder}) => (placeholder ? '#999' : '#333')};
`;

export const ProjectList = styled.View`
  margin-top: 8px;
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  overflow: hidden;
`;

export const ProjectItem = styled.TouchableOpacity<{selected?: boolean}>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
  background-color: ${({selected}) => (selected ? '#f1f1ef' : 'transparent')};
`;

export const ProjectItemText = styled.Text<{selected?: boolean}>`
  font-size: 15px;
  color: ${({selected}) => (selected ? '#191919' : '#333')};
  font-weight: ${({selected}) => (selected ? '600' : '400')};
`;

export const ProjectBadge = styled.View`
  align-self: flex-start;
  background-color: #f1f1ef;
  padding: 6px 12px;
  border-radius: 16px;
`;

export const ProjectBadgeText = styled.Text`
  font-size: 14px;
  color: #191919;
  font-weight: 600;
`;

export const ProjectListDivider = styled.View`
  height: 1px;
  background-color: #eee;
  margin: 0 14px;
`;

export const AddProjectItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  background-color: #191919;
  padding: 6px 12px;
  border-radius: 16px;
  gap: 4px;
  margin: 12px;
`;

export const ImageUploadButton = styled.TouchableOpacity`
  width: 88px;
  height: 88px;
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  border-style: dashed;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

export const ImageCount = styled.Text`
  font-size: 12px;
  color: #999;
`;

export const ImagePreview = styled.View`
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
`;

export const PreviewImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const ImageRemoveButton = styled.TouchableOpacity`
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
`;

export const TextArea = styled.TextInput`
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
  color: #333;
  min-height: 200px;
`;
