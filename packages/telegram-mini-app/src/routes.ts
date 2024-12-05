import type { ComponentType, JSX } from "react";

import { Home } from "./pages/home";

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [{ path: "/", Component: Home }];
