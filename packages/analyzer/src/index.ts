import express, { Request, Response } from "express";
import { config } from "./project-config";
import { BrowserManager } from "./services/screenshot/browser-manager";

const app = express();
const browserManager = new BrowserManager();

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/screenshot", async (req: Request, res: Response) => {
  try {
    const { url, format = "png", quality = 60, userId } = req.body;

    if (!userId || typeof userId !== "number") {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const response = await browserManager.takeScreenshot(
      url,
      format,
      quality,
      userId
    );

    res.json(response);
  } catch (error) {
    console.error("Screenshot error:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("Target closed") ||
        error.message.includes("disconnected")
      ) {
        browserManager.resetBrowser();
      }

      res.status(500).json({
        error: error.message,
      });
    } else {
      res.status(500).json({
        error: "Unknown error",
      });
    }
  }
});

process.on("SIGINT", async () => {
  await browserManager.close();
  process.exit();
});

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  browserManager.initBrowser().catch(console.error);
});
