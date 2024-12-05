import { config, isStorageEnabled } from "@/project-config";
import { ContentAnalysis, RedirectAnalysis, UnifiedReport } from "@/types";
import puppeteer, { Browser, Page } from "puppeteer-core";
import { OpenAIClient } from "../../lib/openai-client";
import { ContentAnalyzer } from "../analysis/content-analyzer";
import { RedirectAnalyzer } from "../analysis/redirect-analyzer";
import { RequestMonitor } from "../analysis/request-monitor";
import { storage } from "../storage";
import { browserConfig } from "./browser-config";
import { waitForLoadingComplete } from "./loading-detector";
import { SupportedFormat } from "./types";

export interface ExtractedContent {
  title: string;
  metaDescription: string;
  mainContent: string;
  links: string[];
}

export class BrowserManager {
  private static instance: BrowserManager;
  private requestMonitor: RequestMonitor;
  private redirectAnalyzer: RedirectAnalyzer;
  private contentAnalyzer: ContentAnalyzer;
  private openai: OpenAIClient;
  private browser: Browser | null;
  private isInitializing: boolean;
  private initPromise: Promise<Browser> | null;

  constructor() {
    this.openai = new OpenAIClient(config.OPENAI_API_KEY);
    this.contentAnalyzer = new ContentAnalyzer(this.openai);
    this.redirectAnalyzer = new RedirectAnalyzer();
    this.requestMonitor = new RequestMonitor();

    this.browser = null;
    this.isInitializing = false;
    this.initPromise = null;

    // Handle process termination
    process.on("SIGTERM", this.cleanup);
    process.on("SIGINT", this.cleanup);
    process.on("beforeExit", this.cleanup);
    process.on("exit", this.cleanup);

    if (process.send) {
      // Handle ts-node-dev restart
      process.on("message", async (message) => {
        if (message === "restart") {
          await this.cleanup();
        }
      });
    }
  }

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  private cleanup = async () => {
    try {
      if (this.browser) {
        const browserProcess = this.browser.process();
        if (browserProcess) {
          browserProcess.kill("SIGTERM");
        }
        await this.browser.close();
        this.browser = null;
      }
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  };

  private async createBrowser(): Promise<Browser> {
    const options = await browserConfig.getBrowserConfig();
    console.log(`Launching browser with executable: ${options.executablePath}`);
    return puppeteer.launch(options);
  }

  private isBrowserConnected(): boolean {
    return !!(this.browser && this.browser.process()?.connected);
  }

  async initBrowser(): Promise<Browser> {
    if (this.browser && this.isBrowserConnected()) {
      return this.browser;
    }

    if (this.isInitializing) {
      return this.initPromise!;
    }

    this.isInitializing = true;
    this.initPromise = this.createBrowser()
      .then((browser) => {
        this.browser = browser;
        browser.on("disconnected", () => {
          this.browser = null;
          this.isInitializing = false;
          this.initPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        this.isInitializing = false;
        this.initPromise = null;
        throw error;
      })
      .finally(() => {
        this.isInitializing = false;
      });

    return this.initPromise;
  }

  async setupPage(page: Page) {
    await page.setViewport(browserConfig.viewport);
    await page.setRequestInterception(true);
    await page.setDefaultNavigationTimeout(
      browserConfig.navigation.timeout || 15000
    );
    await page.setCacheEnabled(false);
    await this.redirectAnalyzer.attachToPage(page);
    this.requestMonitor.attachToPage(page);
  }

  async navigateWithRetry(page: Page, url: string) {
    this.redirectAnalyzer.startTracking(url);
    try {
      console.log(`Navigating to ${url}`);
      await page.goto(url, browserConfig.navigation);
      const loadingStatus = await waitForLoadingComplete(page, {
        maxWaitTime: 5000,
        checkInterval: 100,
      });
      if (loadingStatus.timedOut) {
        console.warn(
          `Loading detection timed out for ${url}. Content found: ${loadingStatus.success}`
        );
      }
    } catch (error) {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      await waitForLoadingComplete(page, {
        maxWaitTime: 3000,
        checkInterval: 100,
      });
    }

    await this.redirectAnalyzer.checkMetaRefresh(page);
  }

  async extractContent(page: Page): Promise<ExtractedContent> {
    const content = await page.evaluate(() => ({
      title: document.title,
      metaDescription:
        (document.querySelector('meta[name="description"]') as HTMLMetaElement)
          ?.content || "",
      mainContent: document.body.innerText.substring(0, 3000),
      links: Array.from(document.querySelectorAll("a")).map((a) => a.href),
    }));

    return content;
  }

  private async uploadReport({
    imageBuffer,
    userId,
    contentAnalysis,
    redirectAnalysis,
  }: {
    imageBuffer: Buffer;
    userId: number;
    contentAnalysis: ContentAnalysis;
    redirectAnalysis: RedirectAnalysis;
  }): Promise<string | undefined> {
    if (!isStorageEnabled()) return undefined;

    const screenshotBase64 = imageBuffer.toString("base64");

    const report: UnifiedReport = {
      url: redirectAnalysis.finalUrl,
      timestamp: Date.now(),
      screenshotBase64,
      contentAnalysis,
      redirectAnalysis,
    };

    const { url } = await storage.storeUnifiedReport(userId, report);
    console.log(`Uploaded report to ${url}`);
    return url;
  }

  async takeScreenshot(
    url: string,
    format: SupportedFormat = "png",
    quality = 60,
    userId: number
  ) {
    let page = null;

    try {
      await this.initBrowser();
      page = await this.browser!.newPage(); // "!" because browser is initialized
      await this.setupPage(page);
      await this.navigateWithRetry(page, url);

      const imageBuffer = (await page.screenshot(
        browserConfig.getScreenshotOptions(format, quality)
      )) as Buffer;

      const content = await this.extractContent(page);
      const contentAnalysis = await this.contentAnalyzer.analyze(content);
      const redirectAnalysis = this.redirectAnalyzer.getAnalysis(page.url());

      const blobUrl = await this.uploadReport({
        imageBuffer,
        userId,
        contentAnalysis,
        redirectAnalysis,
      });

      return {
        imageBuffer: Array.from(new Uint8Array(imageBuffer)),
        metrics: { requests: this.requestMonitor.getMetrics() },
        blobUrl,
        contentAnalysis,
        redirectAnalysis,
      };
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          console.error("Error closing page:", e);
        } finally {
          this.requestMonitor.reset();
        }
      }
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {
        console.error("Error closing browser:", e);
      }
      this.browser = null;
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  resetBrowser() {
    this.close().catch(console.error);
  }
}

export const browserManager = BrowserManager.getInstance();
