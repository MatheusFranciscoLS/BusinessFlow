import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "styled-components";
import { AppRoutes } from "./routes";
import GlobalStyles from "./styles/global";
import { theme } from "./styles/theme";
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* Envolvemos a aplicação no Tema para que todos os botões e ecrãs o conheçam */}
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppRoutes />
    </ThemeProvider>
  </React.StrictMode>,
);
