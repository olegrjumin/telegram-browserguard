import { extractHostname } from "@/utils/extract-hostname";
import { getTld } from "@/utils/get-tld";
import { getDomainAge } from "./data-retrieval/get-domain-age";
import { evaluateDomainAgeRisk } from "./risk";

export const getDomainAgeRaw = async (url: string) => {
  try {
    const hostname = extractHostname(url);
    const tld = getTld(url);

    const domainAge = await getDomainAge(hostname, tld);

    return domainAge;
  } catch (error: unknown) {
    console.error(error);
    return null;
  }
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
