import { miniApp } from "@telegram-apps/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { routes } from "./routes";

export function App() {
  return (
    <AppRoot appearance={miniApp.isDark() ? "dark" : "light"}>
      <HashRouter>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} {...route} />
          ))}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AppRoot>
  );
}
