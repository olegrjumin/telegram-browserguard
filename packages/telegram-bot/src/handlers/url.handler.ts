import { getScreenshot } from "@/core/api";
import { config } from "@/project-config";
import { BotContext } from "@/types";
import type { queueAsPromised } from "fastq";
import fastq from "fastq";
import { RateLimiter } from "limiter";

const userLimiters = new Map<number, RateLimiter>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

interface Task {
  ctx: BotContext;
  url: string;
}

const queue: queueAsPromised<Task> = fastq.promise(processUrl, 1);

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

function getUserLimiter(userId: number): RateLimiter {
  if (!userLimiters.has(userId)) {
    userLimiters.set(
      userId,
      new RateLimiter({
        tokensPerInterval: RATE_LIMIT,
        interval: RATE_WINDOW,
      })
    );
  }
  return userLimiters.get(userId)!;
}

function createMiniAppButton(url: string) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📊 View Detailed Analysis",
            web_app: {
              url: `${config.MINI_APP_URL}?url=${encodeURIComponent(url)}`,
            },
          },
        ],
      ],
    },
  };
}

async function processUrl(task: Task) {
  const { ctx, url } = task;
  try {
    const statusMessage = await ctx.reply(`🔄 Processing: ${url}`);
    const { buffer, contentAnalysis, redirectAnalysis } = await getScreenshot({
      url,
      userId: ctx.message!.from.id,
    });

    if (buffer) {
      await ctx.replyWithPhoto({ source: buffer });
      const redirectInfo = redirectAnalysis.chain
        .map((redirect) => `${redirect.url} (${redirect.statusCode})`)
        .join("\n→ ");

      const analysisMessage = [
        `*Content Analysis*`,
        ``,
        `*Purpose:* ${contentAnalysis.purpose}`,
        `*Risk Score:* ${contentAnalysis.riskScore}/100`,
        `*Potential Risks:*`,
        ...contentAnalysis.risks.map((risk) => `• ${risk}`),
        ``,
        `*Main Topics:*`,
        ...contentAnalysis.mainTopics.map((topic) => `• ${topic}`),
        ``,
        `*Target Audience:* ${contentAnalysis.targetAudience}`,
        ``,
        `*Redirect Chain:*`,
        redirectInfo,
        `Total Redirects: ${redirectAnalysis.totalRedirects}`,
      ].join("\n");

      await ctx.reply(analysisMessage, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...createMiniAppButton(url),
      });
    }

    await ctx.telegram.deleteMessage(ctx.chat!.id, statusMessage.message_id);
  } catch (error) {
    await ctx.reply(`❌ Failed to process: ${url}`);
    console.error(`Error processing URL ${url}:`, error);
  }
}

export const urlHandler =
  () => async (ctx: BotContext, next: () => Promise<void>) => {
    if (ctx.message && "text" in ctx.message && ctx.message.text) {
      const urls = extractUrls(ctx.message.text);
      const userId = ctx.message.from.id;

      if (urls.length === 0) {
        return next();
      }

      const limiter = getUserLimiter(userId);
      const tokensNeeded = urls.length;

      if (!limiter.tryRemoveTokens(tokensNeeded)) {
        await ctx.reply(`⚠️ Rate limit exceeded. Please wait a minute.`);
        return;
      }

      urls.forEach((url) => {
        queue.push({ ctx, url }).catch((error) => {
          console.error("Queue error:", error);
        });
      });
    } else {
      return next();
    }
  };
