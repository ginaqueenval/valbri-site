import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { getPlayerProfile } from "./api/auth";
import "./index.css";
import "./i18n";
import {
  clearStoredPlayerSession,
  getStoredPlayerToken,
  setStoredPlayerSession,
  shouldClearPlayerSessionOnBootstrapError,
} from "./utils/playerAuth.js";

async function bootstrapPlayerSession() {
  if (!getStoredPlayerToken()) {
    return;
  }
  try {
    const res = await getPlayerProfile({ skipSessionExpiredPrompt: true });
    setStoredPlayerSession(
      {
        token: getStoredPlayerToken(),
        player: res.data || null,
      },
      { reason: "bootstrap" },
    );
  } catch (error) {
    if (shouldClearPlayerSessionOnBootstrapError(error)) {
      clearStoredPlayerSession({ reason: "bootstrap" });
    }
  }
}

async function startApp() {
  await bootstrapPlayerSession();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );
}

startApp();
