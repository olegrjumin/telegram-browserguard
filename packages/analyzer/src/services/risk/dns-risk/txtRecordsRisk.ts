import { RiskLevel } from "@/types";

export const evaluateTXTRecordsRisk = (txtRecords: string[][]): RiskLevel => {
  let hasValidConfiguration = false;
  let suspiciousEntries = false;

  if (
    !Array.isArray(txtRecords) ||
    txtRecords.length === 0 ||
    !txtRecords.every((record) => Array.isArray(record) && record.length > 0)
  ) {
    return "HIGH";
  }

  txtRecords.forEach((record) => {
    const lowerRecord = record[0].toLowerCase();

    // Check for valid SPF, DKIM, or DMARC configurations
    if (
      lowerRecord.includes("v=spf1") ||
      lowerRecord.includes("dkim") ||
      lowerRecord.includes("dmarc")
    ) {
      hasValidConfiguration = true;
    }

    // Check for suspicious content (e.g., unexpected redirects or overly long records)
    if (
      lowerRecord.includes("redirect=") ||
      lowerRecord.includes("include=") ||
      lowerRecord.length > 255
    ) {
      suspiciousEntries = true;
    }
  });

  if (suspiciousEntries) {
    return "HIGH";
  } else if (hasValidConfiguration) {
    return "LOW";
  } else {
    return "MEDIUM"; // No valid configuration but no suspicious entries
  }
};
