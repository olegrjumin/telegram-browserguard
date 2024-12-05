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
  PORT: number;
  NODE_ENV: "development" | "production";
  BLOB_READ_WRITE_TOKEN: string;
  ENABLE_STORAGE: boolean;
  OPENAI_API_KEY: string;
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: (process.env.NODE_ENV || "development") as Config["NODE_ENV"],
  BLOB_READ_WRITE_TOKEN: requireEnv("BLOB_READ_WRITE_TOKEN"),
  ENABLE_STORAGE: requireEnv("ENABLE_STORAGE") === "true",
  OPENAI_API_KEY: requireEnv("OPENAI_API_KEY"),
};

export const isDevelopment = () => config.NODE_ENV === "development";
export const isStorageEnabled = () => config.ENABLE_STORAGE;
