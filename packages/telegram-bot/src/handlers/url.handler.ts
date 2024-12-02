import { BotContext } from "types";
import { getScreenshot } from "../core/api";

function extractUrl(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  return urls ? urls[0] : null;
}

function containsUrl(text: string): boolean {
  return extractUrl(text) !== null;
}

export const urlHandler =
  () => async (ctx: BotContext, next: () => Promise<void>) => {
    if (ctx.message && "text" in ctx.message && ctx.message.text) {
      const query = ctx.message.text;

      if (!query || !containsUrl(query)) {
        return next();
      }

      const { buffer } = await getScreenshot(query);

      if (buffer) {
        await ctx.replyWithPhoto({ source: buffer });
      }
    }
  };
