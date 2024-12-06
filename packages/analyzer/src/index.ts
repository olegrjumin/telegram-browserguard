import express, { Request, Response } from "express";
import { OpenAIClient } from "./lib/openai-client";
import { config } from "./project-config";
import {
  AIRiskAnalyzer,
  SecurityAnalysisInput,
} from "./services/analysis/ai-risk-analyzer";
import { getDnsRawData } from "./services/analysis/dns-analysis";
import { getDomainAgeRaw } from "./services/analysis/domain-age";
import { getSSLInfo } from "./services/analysis/get-ssl-info";
import { HttpRedirectAnalyzer } from "./services/analysis/http-redirect-analyzer";
import { dnsAnalysis } from "./services/risk/dns-risk";
import { domainAgeAnalysis } from "./services/risk/domain-age-risk";
import { sslAnalysis } from "./services/risk/ssl-risk";
import { BrowserManager } from "./services/screenshot/browser-manager";
import { storage } from "./services/storage";
import { CleanupService } from "./services/storage/vercel-cleanup-service";

const app = express();
const browserManager = new BrowserManager();
const cleanupService = new CleanupService(storage);

app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));

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

const analyzer = new HttpRedirectAnalyzer();

app.get("/raw", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.toString()) {
    return res.status(400).json({ message: "No url was provided" });
  }

  const urlStr = url.toString();
  try {
    const [redirects, dns, domainAge, ssl] = await Promise.all([
      analyzer.analyze(urlStr),
      getDnsRawData(urlStr),
      getDomainAgeRaw(urlStr),
      getSSLInfo(urlStr),
    ]);

    const openai = new OpenAIClient(config.OPENAI_API_KEY);
    const riskAnalyzer = new AIRiskAnalyzer(openai);

    const securityData: SecurityAnalysisInput = {
      redirects,
      dns,
      domainAge,
      ssl,
    };
    const assessment = await riskAnalyzer.analyze(securityData);

    return res.json({ ...securityData, assessment });
  } catch (e: any) {
    return res.status(500).json({ message: new Error(e).message });
  }
});

app.get("/risk", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.toString()) {
    return res.status(400).json({ message: "No url was provided" });
  }

  try {
    const [dnsInfo, domainAge, sslInfo] = await Promise.all([
      dnsAnalysis(url.toString()),
      domainAgeAnalysis(url.toString()),
      sslAnalysis(url.toString()),
    ]);
    return res.json({ dnsInfo, domainAge, sslInfo });
  } catch (e: any) {
    return res.status(500).json({ message: new Error(e).message });
  }
});

const cleanup = async () => {
  cleanupService.stop();
  await browserManager.close();
  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  browserManager.initBrowser().catch(console.error);
  cleanupService.start();
});
