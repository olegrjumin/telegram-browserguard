import { Telegraf, session } from "telegraf";
import { urlHandler } from "../handlers/url.handler";
import { config, isDevelopment } from "../project-config";
import { BotContext } from "../types";

const bot = new Telegraf<BotContext>(config.BOT_TOKEN);

bot.use(session());

// @ts-ignore
bot.catch((err, ctx) => {
  if (isDevelopment()) {
    ctx.reply("Error: " + err);
  } else {
    ctx.reply("Sorry, something went wrong while processing your request.");
  }
});

// @ts-ignore
bot.command("start", async (ctx) => {
  await ctx.reply("Hello World!");
});

// @ts-ignore
bot.command("help", async (ctx) => {
  await ctx.reply("Help message");
});

// @ts-ignore
bot.on("inline_query", async (ctx) => {
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
