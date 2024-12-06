import { extractHostname } from "@/utils/extract-hostname";
import { getTld } from "@/utils/get-tld";
import { getDomainAge } from "./get-domain-age";

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
