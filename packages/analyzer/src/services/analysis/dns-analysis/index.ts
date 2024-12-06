import { getDnsRawData } from "./data-retrieval/get-dns-data";
import { aggregateIpRiskLevels } from "./risk/ipGeolocationRisk";
import { evaluateMXRecordsRisk } from "./risk/mxRecordsRisk";
import { evaluateTXTRecordsRisk } from "./risk/txtRecordsRisk";

export const dnsAnalysis = async (url: string) => {
  try {
    const { ipGeolocationInfo, txtRecords, mxRecords, isWildcardDomain } =
      await getDnsRawData(url);

    console.log("TXT Records:", txtRecords);
    console.log("MX Records:", mxRecords);
    console.log("IP Geolocation Info:", ipGeolocationInfo);
    console.log("Has wildcard:", isWildcardDomain);

    return {
      ipGeolocationRisk: aggregateIpRiskLevels(ipGeolocationInfo),
      txtRecordsRisk: evaluateTXTRecordsRisk(txtRecords),
      mxRecordsRisk: evaluateMXRecordsRisk(mxRecords),
      wildcardRisk: isWildcardDomain ? "HIGH" : "LOW",
    };
  } catch (error: any) {
    throw new Error(error);
  }
};
