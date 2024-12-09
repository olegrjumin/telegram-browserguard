import { Page } from "puppeteer-core";

const MODERN_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
const MODERN_FIREFOX_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0";
const MODERN_EDGE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0";

interface TwitterConfig {
  userAgent: string;
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    isLandscape: boolean;
  };
  headers: Record<string, string>;
}

const browserConfigs: TwitterConfig[] = [
  {
    userAgent: MODERN_CHROME_UA,
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    },
    headers: {
      "sec-ch-ua":
        '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
  },
  {
    userAgent: MODERN_FIREFOX_UA,
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    },
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      DNT: "1",
    },
  },
  {
    userAgent: MODERN_EDGE_UA,
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    },
    headers: {
      "sec-ch-ua":
        '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
  },
];

export class TwitterPageHandler {
  private static configIndex = 0;

  static async configureForTwitter(page: Page): Promise<void> {
    // Rotate through different browser configurations
    const config = browserConfigs[this.configIndex % browserConfigs.length];
    this.configIndex++;

    // Configure the page
    await page.setUserAgent(config.userAgent);
    await page.setViewport(config.viewport);

    // Set common headers
    const commonHeaders = {
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
      ...config.headers,
    };

    await page.setExtraHTTPHeaders(commonHeaders);

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);

    // Set required cookies
    await page.setCookie({
      name: "seen_cookie_message",
      value: "yes",
      domain: ".twitter.com",
      path: "/",
    });

    // Disable specific resource types that might trigger detection
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["media", "font", "websocket"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  static isTwitterUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === "twitter.com" ||
        urlObj.hostname === "x.com" ||
        urlObj.hostname.endsWith(".twitter.com")
      );
    } catch {
      return false;
    }
  }

  static async extractTwitterContent(page: Page): Promise<{
    title: string;
    metaDescription: string;
    mainContent: string;
    links: string[];
  }> {
    try {
      return await page.evaluate(() => {
        const extractText = (selector: string) => {
          const element = document.querySelector(selector);
          return element ? element.textContent?.trim() || "" : "";
        };

        return {
          title: document.title || "Twitter Content",
          metaDescription:
            extractText('meta[name="description"]') || "Twitter Post",
          mainContent:
            extractText("article") || "Twitter content is not accessible",
          links: Array.from(document.querySelectorAll("a"))
            .map((a) => a.href)
            .filter((href) => href && !href.includes("javascript:"))
            .slice(0, 10),
        };
      });
    } catch (error) {
      console.error("Error extracting Twitter content:", error);
      return {
        title: "Twitter Content",
        metaDescription: "Twitter Post",
        mainContent:
          "Unable to access Twitter content directly. Please visit the link in your browser.",
        links: [page.url()],
      };
    }
  }

  static getErrorFallbackContent(url: string) {
    return {
      title: "Twitter Content",
      metaDescription: "Twitter/X Post",
      mainContent: `This content is available on Twitter/X. Please visit ${url} in your browser to view it.`,
      links: [url],
    };
  }
}
