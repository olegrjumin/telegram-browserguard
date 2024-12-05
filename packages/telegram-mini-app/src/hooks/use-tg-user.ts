import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useMemo } from "react";

export const useTgUser = () => {
  const params = useLaunchParams();
  const { user } = params?.initData || {};
  const currentTgUserId = user?.id?.toString() || "";
  const newUser = useMemo(
    () => ({
      ...user,
      id: currentTgUserId,
    }),
    [user, currentTgUserId],
  );
  return newUser;
};
