import { parse } from "tldts";

export function getTld(url: string): string {
  try {
    const parsed = parse(url);

    if (!parsed.publicSuffix) {
      throw new Error("Invalid URL or unable to extract TLD");
    }

    return parsed.publicSuffix;
  } catch (error) {
    console.error("Error extracting TLD:", error);
    return "";
  }
}
