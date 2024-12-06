import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { Root } from "./Root.tsx";

const isBrowser = typeof window !== "undefined";

export const GlobalRender = () => {
  if (!isBrowser) {
    import("./init.ts").then(({ init }) => {
      init(retrieveLaunchParams().startParam === "debug");
    });
    import("./mockEnv.ts");
    import("@telegram-apps/telegram-ui/dist/styles.css");
  }

  return <Root />;
};
