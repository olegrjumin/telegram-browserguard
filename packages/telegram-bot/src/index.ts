import { bot } from "./core/bot";
import { startServer } from "./core/server";
import { config, isDevelopment } from "./project-config";

async function start() {
  if (isDevelopment()) {
    console.log("Running in development mode");
    await bot.telegram.deleteWebhook();
    await bot.launch();
  } else {
    console.log("Running in production mode");
    const webhookUrl = `https://${config.WEBHOOK_DOMAIN}${config.WEBHOOK_PATH}`;
    await bot.telegram.deleteWebhook();
    await bot.telegram.setWebhook(webhookUrl);
    startServer();
  }
}

start();
