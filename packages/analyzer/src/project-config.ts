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
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: (process.env.NODE_ENV || "development") as Config["NODE_ENV"],
};

export const isDevelopment = () => config.NODE_ENV === "development";
