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
  await ctx.reply(
    "I help protect Telegram users by analyzing links shared in chats and groups for potential security threats and scams. When someone shares a URL in a conversation, I'll:\n\n" +
      "📸 Send a preview screenshot of the website\n" +
      "🔍 Analyze the site's content and purpose\n" +
      "🔒 Check SSL certificates and domain age\n" +
      "🌐 Verify DNS configurations and redirects\n" +
      "⚠️ Identify potential security risks\n" +
      "📊 Generate a comprehensive security report\n\n" +
      "You can use me in:\n" +
      "- Direct messages: Just send a link\n" +
      "- Groups: Add me and I'll analyze shared links\n" +
      "- Inline mode: Type @browserguard_bot in any chat followed by a URL",
    { parse_mode: "HTML" }
  );
});

bot.command("help", async (ctx: BotContext) => {
  await ctx.reply(
    "🛡 *Telegram BrowserGuard Security Analysis*\n\n" +
      "*What I Check:*\n\n" +
      "🔒 *Security Indicators*\n" +
      "• SSL certificate validity and trust\n" +
      "• Domain age and registration info\n" +
      "• Suspicious redirects\n" +
      "• DNS configuration & email security\n" +
      "• Wildcard domain detection\n\n" +
      "🔍 *Content Analysis*\n" +
      "• Phishing detection\n" +
      "• Scam detection\n" +
      "• Risk assessment\n" +
      "• Purpose identification\n" +
      "• Target audience analysis\n\n" +
      "📊 *Reports Include:*\n" +
      "• Website screenshot\n" +
      "• AI Risk analysis\n" +
      "• Specific security findings\n" +
      "• Actionable recommendations\n\n" +
      "Simply send me any link to analyze! 🔎",
    { parse_mode: "Markdown" }
  );
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
