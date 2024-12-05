import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import "@telegram-apps/telegram-ui/dist/styles.css";
import "./index.css";

// Mock the environment in case, we are outside Telegram.
import { init } from "./init.ts";
import "./mockEnv.ts";
import { Root } from "./Root.tsx";

// Configure all application dependencies.
init(retrieveLaunchParams().startParam === "debug");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
