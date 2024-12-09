import { Message } from "telegraf/types";
import { getDomain, getHostname, parse } from "tldts";

export function isValidDomain(text: string): boolean {
  const parsed = parse(text);
  return !!(parsed.domain && parsed.isIcann);
}

export function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
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

export function getUrlsFromMessageEntities(
  message: Message.TextMessage
): string[] {
  const urls: string[] = [];

  if (message.entities) {
    message.entities.forEach((entity) => {
      if (entity.type === "text_link" && entity.url) {
        urls.push(entity.url);
      }
    });
  }

  if (message.text) {
    urls.push(...extractUrls(message.text));
  }

  return [...new Set(urls)];
}
