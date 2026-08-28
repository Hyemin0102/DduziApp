import styled from '@emotion/native';

export const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const ModalContainer = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  position: relative;
`;

export const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
`;

export const Title = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #191919;
  padding-right: 24px;
  margin-bottom: 8px;
`;

export const Description = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 20px;
  margin-bottom: 24px;
`;

export const UpdateButton = styled.TouchableOpacity`
  background-color: #191919;
  border-radius: 10px;
  height: 50px;
  align-items: center;
  justify-content: center;
`;

export const UpdateButtonText = styled.Text`
  color: #fff;
  font-size: 15px;
  font-weight: 600;
`;

