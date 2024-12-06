import { MAX_TIMEOUT } from "@/constants";
import { extractHostname } from "@/utils/extract-hostname";
import { withTimeout } from "@/utils/with-timeout";
import { getIPAddresses } from "./dns";

export const checkWildcardDomain = async (url: string) => {
  const hostname = extractHostname(url);

  const nonExistentSubdomain = `nonexistent-${Date.now()}.${hostname}`;
  try {
    const addresses = await withTimeout(
      getIPAddresses(nonExistentSubdomain, false),
      MAX_TIMEOUT
    );
    return addresses.length > 0;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(`No wildcard DNS detected for ${hostname}`);
    }
    return false;
  }
};
