import { Telegraf, session } from "telegraf";
import { BotContext } from "types";
import { urlHandler } from "../handlers/url.handler";
import { config, isDevelopment } from "../project-config";

const bot = new Telegraf<BotContext>(config.BOT_TOKEN);

bot.use(session());

bot.catch((err: Error, ctx: BotContext) => {
  if (isDevelopment()) {
    ctx.reply("Error: " + err);
  } else {
    ctx.reply("Sorry, something went wrong while processing your request.");
  }
});

bot.command("start", async (ctx: BotContext) => {
  await ctx.reply("Hello World!");
});

bot.command("help", async (ctx: BotContext) => {
  await ctx.reply("Help message");
});

bot.on("inline_query", async (ctx: BotContext) => {
  const query = ctx.inlineQuery.query || "no query";

  await ctx.answerInlineQuery([
    {
      type: "article",
      id: "1",
      title: "Click here to get a report",
      description: "This will analyze provided link",
      input_message_content: {
        message_text: `🔍 Report for: "${query}"\n`,
        parse_mode: "HTML",
      },
      reply_markup: {
        inline_keyboard: [
          [{ text: "Check full report", url: "https://example.com" }],
        ],
      },
    },
  ]);
});

const commands = [{ command: "help", description: "Get help" }];

bot.telegram.setMyCommands(commands);

bot.use(urlHandler());

export { bot };
