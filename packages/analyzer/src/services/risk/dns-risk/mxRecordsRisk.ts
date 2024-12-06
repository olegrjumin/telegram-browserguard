import trustedEmailProviders from "./json/trustedEmailProviders.json";

export const evaluateMXRecordsRisk = (
  mxRecords: { exchange: string; priority: number }[]
): string => {
  let highRisk = false;
  let mediumRisk = false;

  mxRecords.forEach((record) => {
    const domain = record.exchange.toLowerCase();

    if (trustedEmailProviders.some((trusted) => domain.includes(trusted))) {
      // Trusted provider
      return;
    } else if (
      domain.endsWith(".tk") ||
      domain.endsWith(".ml") ||
      domain.endsWith(".ga")
    ) {
      // Known risky TLDs
      highRisk = true;
    } else {
      // Less-known providers
      mediumRisk = true;
    }
  });

  if (highRisk) {
    return "HIGH";
  } else if (mediumRisk) {
    return "MEDIUM";
  } else {
    return "LOW";
  }
};
