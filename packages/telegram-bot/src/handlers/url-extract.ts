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

export function getUrlsFromMessageEntities(
  message: Message.TextMessage
): string[] {
  const urls = new Set<string>();

  if (message.entities) {
    message.entities.forEach((entity) => {
      if (entity.type === "text_link" && entity.url) {
        urls.add(normalizeUrl(entity.url));
      } else if (entity.type === "url") {
        const url = message.text.slice(
          entity.offset,
          entity.offset + entity.length
        );
        urls.add(normalizeUrl(url));
      }
    });
  }

  if (urls.size === 0 && message.text) {
    const matches = message.text.match(
      /(?:https?:\/\/)?(?:www\.)?[^\s.]+\.[^\s]{2,}|(?:www\.)?[^\s]+\.[^\s]{2,}/g
    );
    if (matches) {
      matches.forEach((url) => {
        const parsed = parse(url);
        if (parsed.domain && parsed.isIcann) {
          urls.add(normalizeUrl(url));
        }
      });
    }
  }

  return Array.from(urls);
}
