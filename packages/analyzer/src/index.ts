import express, { Request, Response } from "express";
import { OpenAIClient } from "./lib/openai-client";
import { config } from "./project-config";
import { AIRiskAnalyzer } from "./services/analysis/ai-risk-analyzer";
import { ContentAnalyzer } from "./services/analysis/content-analyzer";
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
import { SecurityAnalysisInput, UnifiedReport } from "./types";

const app = express();
const browserManager = new BrowserManager();
const cleanupService = new CleanupService(storage);
const openai = new OpenAIClient(config.OPENAI_API_KEY);
const contentAnalyzer = new ContentAnalyzer(openai);
const riskAnalyzer = new AIRiskAnalyzer(openai);
const redirectAnalyzer = new HttpRedirectAnalyzer();

app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.post("/screenshot", async (req: Request, res: Response) => {
  try {
    const { url, format = "png", quality = 60 } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const { content, imageBuffer } = await browserManager.takeScreenshot(
      url,
      format,
      quality
    );

    const contentAnalysis = await contentAnalyzer.analyze(content);

    res.json({
      contentAnalysis,
      imageBuffer,
    });
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

app.post("/all", async (req: Request, res: Response) => {
  try {
    const { url, format = "png", quality = 60, userId } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!userId || typeof userId !== "number") {
      return res.status(400).json({ error: "User ID is required" });
    }

    // 1. Take screenshot and analyze content
    const { content, imageBuffer } = await browserManager.takeScreenshot(
      url,
      format,
      quality
    );
    const contentAnalysis = await contentAnalyzer.analyze(content);

    // 2. Perform security analysis
    const [redirects, dns, domainAge, ssl] = await Promise.all([
      redirectAnalyzer.analyze(url),
      getDnsRawData(url),
      getDomainAgeRaw(url),
      getSSLInfo(url),
    ]);

    const securityData: SecurityAnalysisInput = {
      redirects,
      dns,
      domainAge,
      ssl,
    };
    const securityAnalysis = await riskAnalyzer.analyze(securityData);

    // 3. Create and store unified report
    const report: UnifiedReport = {
      url,
      timestamp: Date.now(),
      screenshotBase64: Buffer.from(imageBuffer).toString("base64"),
      contentAnalysis,
      securityData,
      securityAnalysis,
    };

    const { url: blobUrl } = await storage.storeUnifiedReport(userId, report);

    // 4. Return complete analysis results
    res.json({
      imageBuffer,
      blobUrl,
    });
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

app.post("/report", async (req, res) => {
  const {
    url,
    userId,
    screenshotBase64,
    contentAnalysis,
    securityData,
    securityAnalysis,
  } = req.body as UnifiedReport & { userId: number };

  const report: UnifiedReport = {
    url,
    timestamp: Date.now(),
    screenshotBase64,
    contentAnalysis,
    securityData,
    securityAnalysis,
  };

  try {
    const blobUrl = await storage.storeUnifiedReport(userId, report);

    return res.json({
      blobUrl: blobUrl.url,
    });
  } catch (e: any) {
    return res.status(500).json({ message: new Error(e).message });
  }
});

app.get("/raw", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.toString()) {
    return res.status(400).json({ message: "No url was provided" });
  }

  const urlStr = url.toString();
  try {
    const [redirects, dns, domainAge, ssl] = await Promise.all([
      redirectAnalyzer.analyze(urlStr),
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
    const securityAnalysis = await riskAnalyzer.analyze(securityData);

    return res.json({ securityData, securityAnalysis });
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
