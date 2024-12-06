import { IpGeolocationResponse, RiskLevel } from "@/types";
import highRiskCountries from "./json/highRiskCountris.json";
import mediumRiskCountries from "./json/mediumRiskCountries.json";
import trustedISPs from "./json/trustedISPs.json";
import untrustedISPs from "./json/untrustedISPs.json";

export const evaluateIpGeolocationRisk = (
  ipGeolocationInfo: IpGeolocationResponse
): RiskLevel => {
  const { geoInfo } = ipGeolocationInfo;

  const { isp, country_name } = geoInfo || {};

  let geoRisk = "LOW";
  if (highRiskCountries.includes(country_name)) {
    geoRisk = "HIGH";
  } else if (mediumRiskCountries.includes(country_name)) {
    geoRisk = "MEDIUM";
  }

  // Evaluate ISP Risk
  let ispRisk = "MEDIUM"; // Default to medium risk
  if (isp) {
    if (
      untrustedISPs.some((untrusted) =>
        isp.toLowerCase().includes(untrusted.toLowerCase())
      )
    ) {
      ispRisk = "HIGH";
    } else if (
      trustedISPs.some((trusted) =>
        isp.toLowerCase().includes(trusted.toLowerCase())
      )
    ) {
      ispRisk = "LOW";
    }
  }

  // Consolidate Geo Risk and ISP Risk
  if (geoRisk === "HIGH" || ispRisk === "HIGH") {
    return "HIGH";
  } else if (geoRisk === "MEDIUM" || ispRisk === "MEDIUM") {
    return "MEDIUM";
  } else {
    return "LOW";
  }
};

export function aggregateIpRiskLevels(
  ipGeolocationInfoArray: IpGeolocationResponse[]
): RiskLevel {
  return ipGeolocationInfoArray.reduce((highestRisk, ipGeo) => {
    const currentRisk = evaluateIpGeolocationRisk(ipGeo);
    if (highestRisk === "HIGH" || currentRisk === "HIGH") return "HIGH";
    if (currentRisk === "MEDIUM") return "MEDIUM";
    return highestRisk;
  }, "LOW" as RiskLevel);
}
