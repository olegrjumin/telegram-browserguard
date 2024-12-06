import { getDomainAge } from "@/services/analysis/domain-age/get-domain-age";
import { extractHostname } from "@/utils/extract-hostname";
import { getTld } from "@/utils/get-tld";

interface DomainAnalysis {
  creationDate?: string;
  age?: number;
  method: string;
}

export const evaluateDomainAgeRisk = (
  domainAgeInfo: DomainAnalysis
): string => {
  const { age } = domainAgeInfo;

  if (!age) {
    return "INCONCLUSIVE";
  }

  if (age === null || age <= 0) {
    return "HIGH"; // No valid age found or domain is very new
  }

  if (age > 5) {
    return "LOW"; // Domain is older than 5 years, indicating stability
  }

  if (age > 1) {
    return "MEDIUM"; // Domain is 1-5 years old
  }

  return "HIGH"; // Default to high for very new domains (< 1 year)
};

export const domainAgeAnalysis = async (url: string) => {
  try {
    const hostname = extractHostname(url);
    const tld = getTld(url);

    const domainAge = await getDomainAge(hostname, tld);
    if (domainAge) {
      const domainAgeRisk = evaluateDomainAgeRisk(domainAge);
      return {
        domainAgeRisk,
      };
    }
    return null;
  } catch (error: unknown) {
    console.error(error);
    return "INCONCLUSIVE";
  }
};
