import { getDomain, getHostname, parse } from "tldts";

export function isValidDomain(text: string): boolean {
  const parsed = parse(text);
  return !!(parsed.domain && parsed.isIcann);
}

export function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `http://${url}`;
}

export function extractUrls(text: string): string[] {
  const urls: string[] = [];

  const standardUrlRegex = /(https?:\/\/[^\s]+)/g;
  const standardUrls = text.match(standardUrlRegex) || [];
  urls.push(...standardUrls);

  const remainingText = text.replace(standardUrlRegex, "");
  const wwwUrlRegex = /(?<!@)(www\.[^\s]+)/g;
  const wwwUrls = remainingText.match(wwwUrlRegex) || [];
  urls.push(...wwwUrls);

  const words = remainingText
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        word.includes(".") &&
        !word.startsWith(".") &&
        !word.endsWith(".") &&
        !word.includes("@")
    );

  const bareDomains = words.filter(
    (word) => isValidDomain(word) && getDomain(word) !== null
  );

  urls.push(...bareDomains);

  return [...new Set(urls)]
    .map((url) => {
      const hostname = getHostname(url) || url;
      return isValidDomain(hostname) ? normalizeUrl(url) : null;
    })
    .filter((url): url is string => url !== null);
}
