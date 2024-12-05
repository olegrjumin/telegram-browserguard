import {
  getIPAddresses,
  getMXRecords,
  getTXTRecords,
  getIPGeolocationInfo,
  getWildcardDomain,
} from "./data-retrieval";
import evaluateIpGeolocationRisk from "./risk/ipGeolocationRisk";
import evaluateMXRecordsRisk from "./risk/mxRecordsRisk";
import evaluateTXTRecordsRisk from "./risk/txtRecordsRisk";

const dnsAnalysis = async (url: string): Promise<any> => {
  try {
    const addresses = await getIPAddresses(url);

    const [ipGeolocationInfo, txtRecords, mxRecords, wildcard] =
      await Promise.all([
        getIPGeolocationInfo(addresses),
        getTXTRecords(url),
        getMXRecords(url),
        getWildcardDomain(url),
      ]);

    let ipGeolocationRisk = "LOW";
    ipGeolocationInfo.forEach((ipGeo) => {
      const risk = evaluateIpGeolocationRisk(ipGeo);
      if (risk === "HIGH") {
        ipGeolocationRisk = "HIGH";
      } else if (risk === "MEDIUM" && ipGeolocationRisk === "LOW") {
        ipGeolocationRisk = "MEDIUM";
      }
    });

    const txtRecordsRisk: string = evaluateTXTRecordsRisk(txtRecords[0]);
    const mxRecordsRisk: string = evaluateMXRecordsRisk(mxRecords);
    const wildcardRisk = wildcard ? "HIGH" : "LOW";

    return {
      ipGeolocationRisk,
      txtRecordsRisk,
      mxRecordsRisk,
      wildcardRisk,
    };
  } catch (error: any) {
    throw new Error(error);
  }
};

export default dnsAnalysis;
