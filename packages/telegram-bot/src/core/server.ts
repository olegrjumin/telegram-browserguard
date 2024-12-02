import express from "express";
import { config } from "../project-config";
import { bot } from "./bot";

const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body, res);
});

const startServer = async () => {
  app.listen(config.PORT, () => {
    console.log(`Bot server running on port ${config.PORT}`);
  });
};

export { startServer };
