import { Telegraf, session } from "telegraf";
import { config } from "../config";
import { urlHandler } from "../handlers/url.handler";
import { BotContext } from "../types";

const bot = new Telegraf<BotContext>(config.BOT_TOKEN);

bot.use(session());

// @ts-ignore
bot.catch((err, ctx) => {
  ctx.reply("Sorry, something went wrong while processing your request.");
});

// @ts-ignore
bot.command("start", async (ctx) => {
  await ctx.reply("Hello World!");
});

// @ts-ignore
bot.command("help", async (ctx) => {
  await ctx.reply("Help message");
});

bot.use(urlHandler());

export { bot };
