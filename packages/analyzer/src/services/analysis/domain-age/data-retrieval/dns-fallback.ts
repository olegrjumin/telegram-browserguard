import dns, { promises as dnsPromises } from "node:dns";
const { resolveSoa } = dnsPromises;

const dnsFallback = async (hostname: string): Promise<string | null> => {
  try {
    const soaRecord = await resolveSoa(hostname);
    const serial = soaRecord.serial;

    // Serial can sometimes encode a date (not guaranteed)
    if (serial.toString().length === 8) {
      const year = parseInt(serial.toString().slice(0, 4), 10);
      const month = parseInt(serial.toString().slice(4, 6), 10) - 1; // 0-indexed
      const day = parseInt(serial.toString().slice(6, 8), 10);

      return new Date(year, month, day).toISOString().split("T")[0];
    }
    return null;
  } catch (err) {
    console.error(
      `Error in DNS fallback: ${new Error(err as string | undefined).message}`
    );
    return null;
  }
};

export default dnsFallback;
