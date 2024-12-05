import { MAX_TIMEOUT } from "../../../../constants";
import { extractHostname, withTimeout } from "../../../../utils";
import { getIPAddresses } from "./dns";

const getWildcardDomain = async (url: string): Promise<boolean> => {
  const nonExistentSubdomain = `nonexistent-${Date.now()}.${extractHostname(
    url
  )}`;
  try {
    const addresses = await withTimeout(
      getIPAddresses(nonExistentSubdomain, false),
      MAX_TIMEOUT
    );
    return addresses.length > 0; // Wildcard DNS detected
  } catch (err: any) {
    console.log(err);
    return false; // No wildcard DNS
  }
};

export default getWildcardDomain;
