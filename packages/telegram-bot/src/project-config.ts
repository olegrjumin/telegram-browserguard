import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

interface Config {
  BOT_TOKEN: string;
  WEBHOOK_DOMAIN?: string;
  WEBHOOK_PATH: string;
  PORT: number;
  NODE_ENV: "development" | "production";
  ANALYZER_API_URL: string;
  MINI_APP_URL: string;
}

export const config: Config = {
  BOT_TOKEN: requireEnv("BOT_TOKEN"),
  ANALYZER_API_URL: requireEnv("ANALYZER_API_URL"),
  WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN,
  WEBHOOK_PATH: process.env.WEBHOOK_PATH || "/webhook",
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: (process.env.NODE_ENV || "development") as Config["NODE_ENV"],
  MINI_APP_URL: requireEnv("MINI_APP_URL"),
};

export const isDevelopment = (): boolean => config.NODE_ENV === "development";
