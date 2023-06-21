import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { defaultTheme } from "@czi-sds/components";
import App from "./App";
import { SnackbarProvider } from "notistack";
import { store } from "./store";
import { Provider } from "react-redux";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={defaultTheme}>
        <EmotionThemeProvider theme={defaultTheme}>
          <SnackbarProvider maxSnack={3}>
            <Provider store={store}>
              <App />
            </Provider>
          </SnackbarProvider>
        </EmotionThemeProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
