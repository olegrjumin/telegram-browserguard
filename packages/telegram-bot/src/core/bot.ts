import { urlHandler } from "@/handlers/url.handler";
import { config, isDevelopment } from "@/project-config";
import { BotContext } from "@/types/session";
import { Telegraf, session } from "telegraf";

const bot = new Telegraf<BotContext>(config.BOT_TOKEN);

bot.use(session());

bot.catch((err, ctx: BotContext) => {
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
  const query = ctx?.inlineQuery?.query;
  return ctx.answerInlineQuery([
    {
      type: "article",
      id: "1",
      title: "Click here to get a report",
      description: `Analyze: ${query}`,
      input_message_content: {
        message_text: `Analyzing: ${query}`,
      },
    },
  ]);
});

const commands = [{ command: "help", description: "Get help" }];

bot.telegram.setMyCommands(commands);

bot.use(urlHandler());

export { bot };
