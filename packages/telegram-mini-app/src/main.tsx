import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { GlobalRender } from "./global-render.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalRender />
  </StrictMode>,
);
