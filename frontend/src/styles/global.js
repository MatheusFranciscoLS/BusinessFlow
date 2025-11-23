import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    outline: 0;
    box-sizing: border-box;
  }

  body {
    background: #f0f2f5; /* Cor de fundo padrão do sistema */
    -webkit-font-smoothing: antialiased;
  }

  body, input, button {
    font-family: 'Roboto', 'Segoe UI', sans-serif; /* Fontes modernas */
    font-size: 16px;
  }

  button {
    cursor: pointer;
  }
`;