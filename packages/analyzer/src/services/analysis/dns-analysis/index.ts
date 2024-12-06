import { Dns } from "@/types";
import { checkWildcardDomain } from "./check-wildcard-domain";
import { getIPAddresses, getMXRecords, getTXTRecords } from "./dns";
import { getIPGeolocationInfo } from "./get-ip-geolocation-info";

export const getDnsRawData = async (url: string): Promise<Dns> => {
  const addresses = await getIPAddresses(url);
  const ipGeolocationInfo = await getIPGeolocationInfo(addresses);
  const txtRecords = await getTXTRecords(url);
  const mxRecords = await getMXRecords(url);
  const isWildcardDomain = await checkWildcardDomain(url);

  return {
    ipGeolocationInfo,
    txtRecords,
    mxRecords,
    isWildcardDomain,
  };
};
