import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    outline: 0;
    box-sizing: border-box;
  }

  body {
    background: #f7fafc; /* Cor de fundo moderna */
    -webkit-font-smoothing: antialiased;
    color: #1a202c;
  }

  body, input, button, textarea, select {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 15px;
  }

  button {
    cursor: pointer;
  }

  /* Scrollbar Premium Global */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;