import { RedirectAnalysis, RedirectData } from "@/types";
import { Page } from "puppeteer-core";

export class RedirectAnalyzer {
  private redirects: RedirectData[] = [];

  async attachToPage(page: Page): Promise<void> {
    const client = await page.createCDPSession();
    await client.send("Network.enable");

    client.on("Network.responseReceived", (event) => {
      if (event.response.status >= 300 && event.response.status < 400) {
        this.redirects.push({
          url: event.response.url,
          statusCode: event.response.status,
          headers: event.response.headers,
          type: "http",
        });
      }
    });

    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        this.redirects.push({
          url: frame.url(),
          statusCode: 200,
          headers: {},
          type: "js",
        });
      }
    });
  }

  startTracking(initialUrl: string): void {
    this.redirects = [
      {
        url: initialUrl,
        statusCode: 200,
        headers: {},
        type: "http",
      },
    ];
  }

  async checkMetaRefresh(page: Page): Promise<void> {
    const metaRefresh = await page.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="refresh"]');
      return meta ? meta.getAttribute("content") : null;
    });

    if (metaRefresh) {
      this.redirects.push({
        url: page.url(),
        statusCode: 200,
        headers: { "meta-refresh": metaRefresh },
        type: "meta",
      });
    }
  }

  getAnalysis(finalUrl: string): RedirectAnalysis {
    return {
      chain: this.redirects.filter((redirect, index, array) => {
        if (index === 0) return true;
        return redirect.url !== array[index - 1].url;
      }),
      finalUrl,
      totalRedirects: this.redirects.length - 1,
    };
  }
}
