import { Message } from "telegraf/types";
import { parse } from "tldts";

function normalizeUrl(url: string): string {
  const normalized = url.toLowerCase().replace(/\/+$/, "");
  if (normalized.startsWith("http://")) {
    return normalized.replace("http://", "https://");
  }
  if (!normalized.startsWith("http")) {
    return `https://${normalized}`;
  }
  return normalized;
}

function isValidUrl(text: string): boolean {
  try {
    if (!text.trim() || text.includes("@")) {
      return false;
    }

    const normalizedUrl = text.startsWith("http") ? text : `https://${text}`;
    const url = new URL(normalizedUrl);
    const parsedDomain = parse(url.hostname);

    return !!(parsedDomain.domain && parsedDomain.isIcann);
  } catch {
    return false;
  }
}

export function getUrlsFromMessageEntities(
  message: Message.TextMessage
): string[] {
  const urls = new Set<string>();

  if (message.entities) {
    console.log("Entities:", message.entities);
    message.entities.forEach((entity) => {
      if (entity.type === "text_link" && entity.url) {
        if (isValidUrl(entity.url)) {
          urls.add(normalizeUrl(entity.url));
        }
      } else if (entity.type === "url") {
        const url = message.text.slice(
          entity.offset,
          entity.offset + entity.length
        );
        if (isValidUrl(url)) {
          urls.add(normalizeUrl(url));
        }
      }
    });
  }

  if (urls.size === 0 && message.text) {
    const matches = message.text.match(/\S+\.[^\s]{2,}/g);

    if (matches) {
      console.log("Matches:", matches);
      matches.forEach((url) => {
        if (isValidUrl(url)) {
          urls.add(normalizeUrl(url));
        }
      });
    }
  }

  return Array.from(urls);
}
