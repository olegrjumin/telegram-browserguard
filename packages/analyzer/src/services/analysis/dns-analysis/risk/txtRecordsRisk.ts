const evaluateTXTRecordsRisk = (txtRecords: string[]): string => {
  let hasValidConfiguration = false;
  let suspiciousEntries = false;

  txtRecords.forEach((record) => {
    const lowerRecord = record.toLowerCase();

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

export default evaluateTXTRecordsRisk;
