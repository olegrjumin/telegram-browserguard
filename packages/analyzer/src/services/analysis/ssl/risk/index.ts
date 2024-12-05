import trustedIssuers from "./json/trustedIssuers.json";
import untrustedIssuers from "./json/untrustedIssuers.json";

interface SSLInfo {
  validFrom: string | null;
  validTo: string | null;
  issuer: string | null;
  valid: boolean;
  daysRemaining: number;
}

const evaluateSSLRisk = (sslInfo: SSLInfo): "LOW" | "MEDIUM" | "HIGH" => {
  const { valid, daysRemaining, issuer } = sslInfo;

  if (!valid) {
    return "HIGH";
  }

  if (issuer) {
    if (trustedIssuers.some((trusted) => issuer.includes(trusted))) {
      return "LOW";
    }

    if (untrustedIssuers.some((untrusted) => issuer.includes(untrusted))) {
      return "HIGH";
    }
  }

  if (daysRemaining <= 0) {
    return "HIGH"; // Certificate is expired
  } else if (daysRemaining <= 30) {
    return "MEDIUM"; // Certificate is nearing expiry
  }

  // Default risk level if the issuer is not recognized
  return "MEDIUM";
};

export default evaluateSSLRisk;
