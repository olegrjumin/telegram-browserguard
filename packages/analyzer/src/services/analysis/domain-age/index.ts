import getDomainAge from "./data-retrieval";
import evaluateDomainAgeRisk from "./risk";

const domainAgeAnalysis = async (url: string) => {
  try {
    const domainAge = await getDomainAge(url);
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

export default domainAgeAnalysis;
