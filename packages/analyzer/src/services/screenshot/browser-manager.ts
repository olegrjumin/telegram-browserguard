import puppeteer, { Browser, Page } from "puppeteer-core";
import { shouldBlockRequest } from "./blocking-rules";
import { browserConfig } from "./browser-config";
import { waitForLoadingComplete } from "./loading-detector";
import { SupportedFormat } from "./types";

export class BrowserManager {
  public browser: Browser | null;
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      try {
        const options = await browserConfig.getBrowserConfig();
        console.log(
          `Launching browser with executable: ${options.executablePath}`
        );
        this.browser = await puppeteer.launch(options);
      } catch (error) {
        console.error("Browser initialization failed:", error);
        throw error;
      }
    }
    return this.browser;
  }

  async setupPage(page: Page) {
    await page.setViewport(browserConfig.viewport);
    await page.setRequestInterception(true);
    await page.setDefaultNavigationTimeout(
      browserConfig.navigation.timeout || 15000
    );
    await page.setCacheEnabled(false);
  }

  async navigateWithRetry(page: Page, url: string) {
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
  }

  private getMimeType(format: SupportedFormat): string {
    return `image/${format}`;
  }

  async takeScreenshot(
    url: string,
    format: SupportedFormat = "jpeg",
    quality = 60
  ) {
    let page = null;
    let metrics = { requests: { blocked: 0, allowed: 0, total: 0 } };

    try {
      await this.initBrowser();
      if (!this.browser) {
        throw new Error("Browser failed to initialize");
      }
      page = await this.browser.newPage();
      await this.setupPage(page);

      page.on("request", (request) => {
        if (shouldBlockRequest(request.url())) {
          metrics.requests.blocked++;
          request.abort();
        } else {
          metrics.requests.allowed++;
          request.continue();
        }
      });

      await this.navigateWithRetry(page, url);

      const screenshot = await page.screenshot(
        browserConfig.getScreenshotOptions(format, quality)
      );

      metrics.requests.total =
        metrics.requests.blocked + metrics.requests.allowed;
      console.log(metrics);

      return { screenshot, metrics };
    } finally {
      if (page) await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  resetBrowser() {
    this.browser = null;
  }
}
