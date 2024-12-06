import { MAX_TIMEOUT } from "@/constants";
import { DomainAge } from "@/types";
import { withTimeout } from "@/utils/with-timeout";
import {
  calculateDomainAge,
  extractCreationDateFromWhois,
} from "./date-calculations";
import { dnsFallback } from "./dns-fallback";
import { whoisQuery } from "./whois-query";

const getDnsAge = async (hostname: string): Promise<DomainAge> => {
  try {
    const dnsCreationDate = await dnsFallback(hostname);
    if (!dnsCreationDate) return null;

    return {
      method: "DNS Fallback",
      creationDate: dnsCreationDate,
      age: calculateDomainAge(dnsCreationDate),
    };
  } catch (error) {
    console.error("DNS fallback failed:", error);
    return null;
  }
};

const getWhoisAge = async (
  hostname: string,
  tld: string,
  timeoutMs: number
): Promise<DomainAge> => {
  try {
    const whoisData = await withTimeout(whoisQuery(hostname, tld), timeoutMs);
    if (!whoisData) return null;

    const creationDate = extractCreationDateFromWhois(whoisData);
    if (!creationDate) return null;

    return {
      method: "WHOIS",
      creationDate,
      age: calculateDomainAge(creationDate),
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        error.message === "Operation timed out"
          ? "WHOIS query timed out"
          : "WHOIS query failed:",
        error
      );
    }
    return null;
  }
};

export const getDomainAge = async (
  hostname: string,
  tld: string
): Promise<DomainAge> => {
  const whoisResult = await getWhoisAge(hostname, tld, MAX_TIMEOUT);
  if (whoisResult) return whoisResult;

  return getDnsAge(hostname);
};
