import { MAX_TIMEOUT } from "@/constants";
import { extractHostname } from "@/utils/extract-hostname";
import { withTimeout } from "@/utils/with-timeout";
import dns, { promises as dnsPromises } from "node:dns";
const { resolveCname, resolveTxt, resolveMx } = dnsPromises;

export const getIPAddresses = (
  url: string,
  shouldExtractHostname: boolean = true
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    try {
      const hostname = shouldExtractHostname ? extractHostname(url) : url;
      dns.resolve(hostname, (err, addresses) => {
        if (err) {
          reject(`DNS lookup failed for ${url}: ${err.message}`);
        } else {
          resolve(addresses);
        }
      });
    } catch (err: any) {
      reject(`Invalid URL: ${new Error(err)?.message}`);
    }
  });
};

export const getRecords = (url: string): Promise<dns.AnyRecord[]> => {
  return new Promise((resolve, reject) => {
    const hostname = extractHostname(url);
    dns.resolveAny(hostname, (err, records) => {
      if (err) {
        reject(`Failed to fetch DNS records for ${hostname}: ${err.message}`);
      } else {
        resolve(records);
      }
    });
  });
};

export const getHostnames = (ipAddress: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    dns.reverse(ipAddress, (err, hostnames) => {
      if (err) {
        reject(`Reverse DNS lookup failed for ${ipAddress}: ${err.message}`);
      } else {
        resolve(hostnames);
      }
    });
  });
};

export const getCNAMERecords = async (url: string) => {
  const hostname = extractHostname(url);
  try {
    const aliases = await withTimeout(resolveCname(hostname), MAX_TIMEOUT);
    return aliases;
  } catch (err) {
    return []; // No CNAME records
  }
};

export const getTXTRecords = async (url: string): Promise<string[][]> => {
  try {
    const mainDomain = extractHostname(url);
    const txtRecords = await resolveTxt(mainDomain);
    return txtRecords;
  } catch (err) {
    return [];
  }
};

export const getMXRecords = async (url: string) => {
  const mainDomain = extractHostname(url);
  try {
    const mxRecords = await resolveMx(mainDomain);
    return mxRecords;
  } catch (err) {
    return [];
  }
};
