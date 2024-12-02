import { Context } from "telegraf";
export interface BotContext extends Context {}

export interface ScreenshotAPIResponse {
  buffer: Buffer;
}
