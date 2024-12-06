import { checkWildcardDomain } from "./check-wildcard-domain";
import { getIPAddresses, getMXRecords, getTXTRecords } from "./dns";
import {
  getIPGeolocationInfo,
  IpGeolocationResponse,
} from "./get-ip-geolocation-info";

export type DnsRawData = {
  ipGeolocationInfo: IpGeolocationResponse[];
  txtRecords: string[][];
  mxRecords: Array<{
    exchange: string;
    priority: number;
  }>;
  isWildcardDomain: boolean;
};

export const getDnsRawData = async (url: string): Promise<DnsRawData> => {
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
