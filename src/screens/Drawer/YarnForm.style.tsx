import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';

export const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

/* ─── 이미지 ─── */

export const ImageArea = styled.View`
  align-items: center;
  padding: 24px 20px 8px;
`;

export const ImageButton = styled.TouchableOpacity`
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const Image = styled(FastImage)`
  width: 120px;
  height: 120px;
`;

export const ImageBadge = styled.View`
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: rgba(0, 0, 0, 0.6);
  align-items: center;
  justify-content: center;
`;

export const ImageHint = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
`;

/* ─── 섹션 / 입력 행 ─── */

export const Section = styled.View`
  padding: 16px 20px 4px;
  border-bottom-width: 6px;
  border-bottom-color: #f5f5f5;
`;

export const SectionTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
`;

export const FieldRow = styled.View`
  flex-direction: row;
  align-items: center;
  min-height: 48px;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

export const FieldLabel = styled.Text`
  width: 84px;
  font-size: 14px;
  color: #999;
`;

export const Required = styled.Text`
  color: #ff3b30;
`;

export const FieldInput = styled.TextInput`
  flex: 1;
  font-size: 15px;
  color: #191919;
  padding: 12px 0;
`;

export const FieldPressable = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
`;

export const FieldValue = styled.Text<{placeholder?: boolean}>`
  font-size: 15px;
  color: ${({placeholder}) => (placeholder ? '#bbb' : '#191919')};
`;

export const FieldUnit = styled.Text`
  font-size: 14px;
  color: #999;
  margin-left: 6px;
`;

export const FieldHint = styled.Text`
  font-size: 12px;
  color: #999;
  padding: 6px 0 10px;
`;

export const MemoInput = styled.TextInput`
  min-height: 96px;
  font-size: 15px;
  color: #191919;
  padding: 4px 0 16px;
  text-align-vertical: top;
`;

/* ─── 용도 태그 ─── */

export const TagWrap = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 16px;
`;

export const Tag = styled.TouchableOpacity<{active?: boolean}>`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border-radius: 16px;
  background-color: ${({active}) => (active ? '#191919' : '#f5f5f5')};
`;

export const TagText = styled.Text<{active?: boolean}>`
  font-size: 13px;
  font-weight: 500;
  color: ${({active}) => (active ? '#fff' : '#555')};
`;

export const TagInput = styled.TextInput`
  min-width: 80px;
  padding: 6px 14px;
  border-radius: 16px;
  border-width: 1px;
  border-color: #ddd;
  font-size: 13px;
  color: #191919;
`;

/* ─── 연결된 프로젝트 ─── */

export const ProjectRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

export const ProjectThumb = styled(FastImage)`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #f0f0f0;
`;

export const ProjectThumbPlaceholder = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const ProjectTitle = styled.Text`
  flex: 1;
  font-size: 15px;
  color: #191919;
`;

export const AddLinkButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 14px 0;
`;

export const AddLinkText = styled.Text`
  font-size: 14px;
  color: #555;
`;

export const SelectCircle = styled.View<{selected: boolean}>`
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border-width: 1.5px;
  border-color: ${({selected}) => (selected ? '#191919' : '#ccc')};
  background-color: ${({selected}) => (selected ? '#191919' : 'transparent')};
  align-items: center;
  justify-content: center;
`;

export const SheetTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #191919;
  padding: 8px 20px 12px;
`;

export const SheetEmpty = styled.Text`
  font-size: 14px;
  color: #999;
  padding: 24px 20px;
  text-align: center;
`;

/* ─── 하단 저장 버튼 ─── */

export const BottomBar = styled.View`
  padding: 12px 16px 16px;
  border-top-width: 1px;
  border-top-color: #f0f0f0;
  background-color: #fff;
`;

export const SaveButton = styled.TouchableOpacity<{disabled?: boolean}>`
  padding-vertical: 16px;
  border-radius: 14px;
  background-color: #000;
  align-items: center;
  opacity: ${({disabled}) => (disabled ? 0.4 : 1)};
`;

export const SaveButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

/* ─── 상세 화면 ─── */

// 상세 상단: 왼쪽 사진(작게, 없으면 같은 크기 플레이스홀더) + 오른쪽 브랜드/이름
export const DetailHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-bottom-width: 6px;
  border-bottom-color: #f5f5f5;
`;

export const DetailImage = styled(FastImage)`
  width: 88px;
  height: 88px;
  border-radius: 12px;
  background-color: #f0f0f0;
`;

export const DetailImagePlaceholder = styled.View`
  width: 88px;
  height: 88px;
  border-radius: 12px;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const DetailHeaderText = styled.View`
  flex: 1;
`;

export const DetailBrand = styled.Text`
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
`;

export const DetailName = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #111;
`;

export const DetailSubText = styled.Text`
  font-size: 14px;
  color: #555;
  margin-top: 6px;
`;

export const DetailRow = styled.View`
  flex-direction: row;
  padding: 12px 0;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

export const DetailLabel = styled.Text`
  width: 84px;
  font-size: 14px;
  color: #999;
`;

export const DetailValue = styled.Text`
  flex: 1;
  font-size: 15px;
  color: #191919;
  line-height: 21px;
`;

export const DetailMemo = styled.Text`
  font-size: 15px;
  color: #333;
  line-height: 22px;
  padding: 4px 0 16px;
`;

export const DetailEmpty = styled.Text`
  font-size: 14px;
  color: #bbb;
  padding: 8px 0 16px;
`;

/* ─── 바늘: 칩 그룹 / 호수 변환 팁 ─── */

export const SectionTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const TipButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  background-color: #f5f5f5;
  margin-bottom: 4px;
`;

export const TipText = styled.Text`
  font-size: 12px;
  color: #555;
`;

export const GroupLabel = styled.Text`
  font-size: 13px;
  color: #999;
  padding-top: 10px;
`;

export const ConvertTabs = styled.View`
  flex-direction: row;
  gap: 8px;
  padding: 0 20px 12px;
`;

export const ConvertTable = styled.View`
  margin: 0 20px 12px;
  border-width: 0.5px;
  border-color: #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
`;

export const ConvertRow = styled.View<{header?: boolean; even?: boolean}>`
  flex-direction: row;
  background-color: ${({header, even}) => (header ? '#f5f5f5' : even ? '#fafafa' : '#fff')};
  border-bottom-width: 0.5px;
  border-bottom-color: #eee;
`;

export const ConvertCell = styled.Text<{header?: boolean; last?: boolean}>`
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  font-weight: ${({header}) => (header ? '600' : '400')};
  color: ${({header}) => (header ? '#555' : '#191919')};
  border-right-width: ${({last}) => (last ? '0px' : '0.5px')};
  border-right-color: #eee;
`;

export const ConvertNote = styled.Text`
  font-size: 12px;
  color: #999;
  line-height: 18px;
  padding: 0 20px 12px;
`;

/* ─── 섹션 제목 옆 "나만 볼 수 있어요" ─── */

export const SectionTitleInline = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

export const PrivateBadge = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 3px;
`;

export const PrivateBadgeText = styled.Text`
  font-size: 12px;
  color: #999;
`;

/* ─── 실 폼 상단: 실 정보 화면(DetailHeader)과 같은 레이아웃 ─── */

export const FormHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-bottom-width: 6px;
  border-bottom-color: #f5f5f5;
`;

export const FormImageButton = styled.TouchableOpacity`
  width: 88px;
  height: 88px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

export const FormImage = styled(FastImage)`
  width: 88px;
  height: 88px;
`;

export const FormImageBadge = styled.View`
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background-color: rgba(0, 0, 0, 0.6);
  align-items: center;
  justify-content: center;
`;

// 입력 중엔 브랜드/이름을 같은 크기·굵기로 (다른 입력칸과 동일). 저장 후 실 정보 화면에서만 크기 차이를 둠
export const HeaderBrandInput = styled.TextInput`
  font-size: 15px;
  color: #191919;
  padding: 10px 0;
  border-bottom-width: 0.5px;
  border-bottom-color: #eee;
`;

export const HeaderNameInput = styled.TextInput`
  font-size: 15px;
  color: #191919;
  padding: 10px 0;
  border-bottom-width: 0.5px;
  border-bottom-color: #eee;
`;
