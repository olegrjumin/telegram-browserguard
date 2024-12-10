import { getAll } from "@/core/api";
import { config, isDevelopment } from "@/project-config";
import { BotContext } from "@/types/session";
import type { queueAsPromised } from "fastq";
import fastq from "fastq";
import { RateLimiter } from "limiter";
import { getUrlsFromMessageEntities } from "./url-extract";

const userLimiters = new Map<number, RateLimiter>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

interface Task {
  ctx: BotContext;
  url: string;
}

const BOT_START_TIME = Date.now();

const queue: queueAsPromised<Task> = fastq.promise(processUrl, 1);

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

function createMiniAppButton(url: string, ctx: BotContext) {
  const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

  if (isGroup) {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📊 View Analysis",
              url: `${config.MINI_APP_URL}?url=${encodeURIComponent(url)}`,
            },
          ],
        ],
      },
    };
  }

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

const getRecommendation = (contentScore: number, technicalScore: number) => {
  const avgScore = (contentScore + technicalScore) / 2;
  if (avgScore >= 70)
    return "⛔️ This link appears to be high risk. Exercise extreme caution.";
  if (avgScore >= 40)
    return "⚠️ This link shows some risk factors. Proceed with caution.";
  return "✅ This link appears to be relatively safe, but always be vigilant.";
};

async function processUrl(task: Task) {
  const { ctx, url } = task;
  try {
    const statusMessage = await ctx.reply(`🔄 Processing: ${url}`);
    const userId = ctx.message!.from.id;

    const {
      blobUrl,
      imageBuffer,
      contentAnalysisRiskScore,
      securityAnalysisRiskScore,
    } = await getAll(url, userId);

    if (imageBuffer) {
      let message = `🔍 *Analysis Result:*\n\n${getRecommendation(
        contentAnalysisRiskScore,
        securityAnalysisRiskScore
      )}\nFor detailed analysis, click button below.\n\n`;

      if (isDevelopment()) {
        message += `🔗 [View detailed analysis (DEV ONLY)](${blobUrl})`;
      }

      await ctx.replyWithPhoto(
        { source: Buffer.from(imageBuffer) },
        {
          caption: message,
          parse_mode: "Markdown",
          ...createMiniAppButton(blobUrl, ctx),
        }
      );
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
      const messageTime = ctx.message.date * 1000;
      if (messageTime < BOT_START_TIME) {
        console.log(`Skipping old message from ${new Date(messageTime)}`);
        return next();
      }

      console.log("Message text", ctx.message.text);
      const urls = getUrlsFromMessageEntities(ctx.message);
      console.log("Extracted urls:", urls);
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
