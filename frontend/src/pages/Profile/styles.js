import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Container = styled.div`
  width: 100%;
  padding-bottom: 40px;
  animation: ${fadeIn} 0.4s ease;
`;

export const Header = styled.header`
  margin-bottom: 32px;
  h1 {
    font-size: 26px;
    color: #1a202c;
    font-weight: 800;
  }
  p {
    color: #718096;
    font-size: 14px;
    margin-top: 4px;
  }
`;

export const ProfileCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  padding: 32px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  max-width: 650px;
  @media (max-width: 500px) {
    padding: 20px;
  }
`;

export const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #edf2f7;

  .avatar-container {
    position: relative;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    overflow: hidden;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #3182ce;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder {
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .upload-btn {
    position: relative;
    background: #edf2f7;
    color: #4a5568;
    font-weight: 600;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s;
    &:hover {
      background: #e2e8f0;
    }
    input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  h3 {
    font-size: 14px;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 16px;
    margin-bottom: 8px;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-size: 13px;
    font-weight: 600;
    color: #4a5568;
  }
  input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 14px;
    transition: all 0.2s;
    &:focus {
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
      outline: none;
    }
  }
`;

export const ActionButton = styled.button`
  margin-top: 32px;
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: #3182ce;
  color: white;
  box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);
  transition: all 0.2s;
  &:hover {
    background: #2c5282;
    transform: translateY(-2px);
  }
`;
