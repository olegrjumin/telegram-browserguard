import highRiskCountries from "./json/highRiskCountris.json";
import mediumRiskCountries from "./json/mediumRiskCountries.json";
import trustedISPs from "./json/trustedISPs.json";
import untrustedISPs from "./json/untrustedISPs.json";

interface GeoInfo {
  ip: string;
  continent_code?: string;
  continent_name?: string;
  country_code2: string;
  country_code3: string;
  country_name: string;
  country_name_official: string;
  city: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  is_eu: false;
  geoname_id: string;
  isp?: string;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
}

interface IpGeolocationResponse {
  geoInfo: GeoInfo;
}

const evaluateIpGeolocationRisk = (
  ipGeolocationInfo: IpGeolocationResponse
): string => {
  const { geoInfo } = ipGeolocationInfo;
  const { isp, country_name } = geoInfo;

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

export default evaluateIpGeolocationRisk;
