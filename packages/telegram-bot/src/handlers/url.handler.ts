import { getScreenshot } from "../core/api";
import { BotContext } from "../types";

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
    // @ts-ignore
    if (ctx.message && "text" in ctx.message && ctx.message.text) {
      // @ts-ignore
      const query = ctx.message.text;

      if (!query || !containsUrl(query)) {
        return next();
      }

      const data = await getScreenshot(query);
      console.log("🚀 ~ bot.on ~ response:", data);

      if (data.screenshot) {
        // @ts-ignore
        await ctx.replyWithPhoto({ source: data.screenshot });
      }
    }
  };
