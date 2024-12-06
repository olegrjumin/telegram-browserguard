import { isValidDate } from "@/utils/is-valid-date";
import { promises as dns } from "node:dns";

interface SOADate {
  year: number;
  month: number;
  day: number;
}

const parseSerial = (serial: number): SOADate | null => {
  const serialStr = serial.toString();

  if (serialStr.length < 8) return null;

  const year = parseInt(serialStr.slice(0, 4), 10);
  const month = parseInt(serialStr.slice(4, 6), 10);
  const day = parseInt(serialStr.slice(6, 8), 10);

  if (year < 1980 || year > new Date().getFullYear()) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return {
    year,
    month: month - 1,
    day,
  };
};

export const dnsFallback = async (hostname: string): Promise<string | null> => {
  try {
    const soaRecord = await dns.resolveSoa(hostname);

    const date = parseSerial(soaRecord.serial);
    if (!date) return null;

    const soaDate = new Date(date.year, date.month, date.day);
    if (!isValidDate(soaDate)) return null;

    return soaDate.toISOString().split("T")[0];
  } catch (error) {
    if (error instanceof Error) {
      const errorType = error.message.includes("ENOTFOUND")
        ? "Domain not found"
        : error.message.includes("ENODATA")
        ? "No SOA record"
        : "DNS query failed";

      console.error(`DNS fallback failed for ${hostname}: ${errorType}`, {
        error: error.message,
        hostname,
      });
    }
    return null;
  }
};
