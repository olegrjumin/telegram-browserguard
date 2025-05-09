import { Context, Scenes } from "telegraf";

interface SessionData {}
export type BotContext = Context & Scenes.SceneContext;
type BotSession = SessionData & Scenes.SceneSession<Scenes.SceneSessionData>;
export interface Bot extends BotContext {
  session: BotSession;
}
