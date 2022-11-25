import * as React from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { CssBaseline, CircularProgress } from "@mui/material";
import {
  createTheme,
  ThemeProvider,
  Theme,
  StyledEngineProvider,
} from "@mui/material/styles";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Main from "./components/Main";
import mainStore from "./stores/MainStore";

// CAREFUL: ANY CHANGE SHOULD BE APPLIED TO LIGHT THEME TOO (BELOW)
const theme = createTheme({});

const App = observer((props) => {
  return (
    <Router>
      <Switch>
        <Route path="/">
          <StyledEngineProvider injectFirst>
            {/*<ThemeProvider theme={settingsStore.settings.theme === 'DARK' ? darkTheme : lightTheme}>*/}
            <ThemeProvider theme={theme}>
              {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
              <CssBaseline />
              {mainStore.data.doneInitialLoading && <Main />}
              {!mainStore.data.doneInitialLoading && (
                <div
                  style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress />
                </div>
              )}
            </ThemeProvider>
          </StyledEngineProvider>
        </Route>
      </Switch>
    </Router>
  );
});

export default App;
