import { config, isDevelopment } from "./config";
import { bot } from "./core/bot";
import { startServer } from "./core/server";

async function start() {
  if (isDevelopment()) {
    await bot.telegram.deleteWebhook();
    await bot.launch();
  } else {
    const webhookUrl = `https://${config.WEBHOOK_DOMAIN}${config.WEBHOOK_PATH}`;
    await bot.telegram.deleteWebhook();
    await bot.telegram.setWebhook(webhookUrl);
    startServer();
  }
}

start();
