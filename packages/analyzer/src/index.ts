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
import { ImageUtils } from "./utils/image-utils";
import { IMAGES } from "./utils/images";

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
    const { url, format = "png", quality = 30 } = req.body;

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
    const { url, format = "jpeg", quality = 50, userId } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!userId || typeof userId !== "number") {
      return res.status(400).json({ error: "User ID is required" });
    }

    const [screenshotResult, securityResults] = await Promise.all([
      (async () => {
        try {
          const screenshotData = await browserManager.takeScreenshot(
            url,
            format,
            quality
          );
          return {
            success: true,
            content: screenshotData.content,
            imageBuffer: screenshotData.imageBuffer,
          };
        } catch (error) {
          console.error("Screenshot failed:", error);
          return {
            success: false,
            content: {
              title: url,
              metaDescription: "",
              mainContent: "",
              links: [url],
            },
            imageBuffer: ImageUtils.base64ToBuffer(
              IMAGES.SCREENSHOT_UNAVAILABLE
            ),
          };
        }
      })(),

      Promise.all([
        redirectAnalyzer.analyze(url),
        getDnsRawData(url),
        getDomainAgeRaw(url),
        getSSLInfo(url),
      ]),
    ]);

    const { content, imageBuffer } = screenshotResult;
    const [redirects, dns, domainAge, ssl] = securityResults;

    const [contentAnalysis, securityAnalysis] = await Promise.all([
      contentAnalyzer.analyze(content),
      riskAnalyzer.analyze({
        redirects,
        dns,
        domainAge,
        ssl,
      }),
    ]);

    const report: UnifiedReport = {
      url,
      timestamp: Date.now(),
      contentAnalysis,
      securityData: {
        redirects,
        dns,
        domainAge,
        ssl,
      },
      securityAnalysis,
      screenshotBase64: Buffer.from(imageBuffer).toString("base64"),
    };

    const { url: blobUrl } = await storage.storeUnifiedReport(userId, report);

    res.json({
      imageBuffer,
      blobUrl,
      contentAnalysisRiskScore: contentAnalysis.riskScore,
      securityAnalysisRiskScore: securityAnalysis.riskScore,
    });
  } catch (error) {
    console.error("Analysis error:", error);

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
