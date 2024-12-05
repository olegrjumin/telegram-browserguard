// Domain Age
import { extractHostname } from "../../../../utils";
import whoisQuery from "./whois-query";
import { calculateDomainAge, extractCreationDate } from "./date-calculations";
import dnsFallback from "./dns-fallback";
import { MAX_TIMEOUT } from "../../../../constants";

interface DomainAnalysis {
  creationDate?: string;
  age?: number;
  method: string;
}

const getDomainAge = async (url: string): Promise<DomainAnalysis | null> => {
  const hostname = extractHostname(url);
  const tld = hostname.split(".").pop() || "";
  try {
    const whoisPromise = whoisQuery(hostname, tld).then((data) => {
      if (data) {
        console.log("data from whoisQUERY ", data);
        const creationDate = extractCreationDate(data);
        if (creationDate) {
          const age = calculateDomainAge(creationDate);
          return { method: "WHOIS", creationDate, age };
        }
      }
      return null;
    });

    const whoisResult = await Promise.race([
      whoisPromise,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), MAX_TIMEOUT)
      ),
    ]);

    console.log(whoisResult);

    if (whoisResult) return whoisResult;

    const dnsCreationHint = await dnsFallback(hostname);
    if (dnsCreationHint) {
      const age = calculateDomainAge(dnsCreationHint);
      return { method: "DNS Fallback", creationDate: dnsCreationHint, age };
    }
    return null;
  } catch (error: any) {
    console.error(
      `Failed to fetch WHOIS data for domain ${url}:`,
      error.message
    );
    return null;
  }
};

export default getDomainAge;
