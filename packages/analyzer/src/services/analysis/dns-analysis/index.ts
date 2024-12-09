import { Dns } from "@/types";
import { extractHostname } from "@/utils/extract-hostname";
import { checkWildcardDomain } from "./check-wildcard-domain";
import { getDNSAddresses, getMXRecords, getTXTRecords } from "./dns";
import { getIPGeolocationInfo } from "./get-ip-geolocation-info";

export const getDnsRawData = async (url: string): Promise<Dns> => {
  const hostname = extractHostname(url);
  const { addresses, result } = await getDNSAddresses(hostname);

  const [ipGeolocationInfo, txtRecords, mxRecords, isWildcardDomain] =
    await Promise.all([
      addresses.length > 0 ? getIPGeolocationInfo(addresses) : [],
      getTXTRecords(hostname),
      getMXRecords(hostname),
      checkWildcardDomain(url),
    ]);

  return {
    ipGeolocationInfo,
    txtRecords,
    mxRecords,
    isWildcardDomain,
    result,
  };
};
