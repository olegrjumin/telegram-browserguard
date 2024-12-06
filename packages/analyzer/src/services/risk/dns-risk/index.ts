import { getDnsRawData } from "@/services/analysis/dns-analysis";
import { aggregateIpRiskLevels } from "./ipGeolocationRisk";
import { evaluateMXRecordsRisk } from "./mxRecordsRisk";
import { evaluateTXTRecordsRisk } from "./txtRecordsRisk";

export const dnsAnalysis = async (url: string) => {
  try {
    const { ipGeolocationInfo, txtRecords, mxRecords, isWildcardDomain } =
      await getDnsRawData(url);

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
