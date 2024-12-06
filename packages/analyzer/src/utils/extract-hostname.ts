import { parse } from "tldts";

export function extractHostname(url: string): string {
  try {
    const hasProtocol = url.includes("://");
    const urlWithProtocol = hasProtocol ? url : `http://${url}`;

    const parsed = parse(urlWithProtocol);

    if (!parsed.domain) {
      throw new Error("Invalid URL or unable to extract domain");
    }

    return parsed.domain;
  } catch (error) {
    throw new Error(`Failed to extract hostname: ${error}`);
  }
}
