import { Context, Scenes } from "telegraf";

interface SessionData {}
export type BotContext = Context & Scenes.SceneContext;
type BotSession = SessionData & Scenes.SceneSession<Scenes.SceneSessionData>;
export interface Bot extends BotContext {
  session: BotSession;
}

export interface ContentAnalysis {
  purpose: string;
  risks: string[];
  isScam: boolean;
  riskScore: number;
  mainTopics: string[];
  targetAudience: string;
}

export interface ScreenshotAPIResponse {
  imageBuffer: Buffer;
  contentAnalysis: ContentAnalysis;
  blobUrl: string;
  metrics: {
    requests: {
      blocked: number;
      allowed: number;
      total: number;
    };
  };
}
