import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    outline: 0;
    box-sizing: border-box;
  }

  body {
    background: #f7fafc; 
    -webkit-font-smoothing: antialiased;
    color: #1a202c;
  }

  body, button, textarea, select {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 15px; /* Fonte padrão do sistema */
  }

  /* 🔥 SEGREDO MOBILE: Obriga inputs a terem no mínimo 16px para evitar o zoom agressivo do iOS */
  input {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 16px !important; 
  }

  button {
    cursor: pointer;
  }

  /* Scrollbar Premium Global (Suave e Invisível até usar) */
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
