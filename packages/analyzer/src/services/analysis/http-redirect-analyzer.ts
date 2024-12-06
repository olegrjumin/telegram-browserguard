import { RedirectAnalysis, RedirectData } from "@/types";
import axios from "axios";

export class HttpRedirectAnalyzer {
  private redirects: RedirectData[] = [];
  private finalUrl: string = "";
  private readonly maxRedirects: number = 5;

  async analyzeWithRedirects(url: string, depth: number = 0): Promise<void> {
    if (depth >= this.maxRedirects) {
      console.warn(`Max redirects (${this.maxRedirects}) reached`);
      this.finalUrl = url;
      return;
    }

    try {
      const response = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => true,
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const status = response.status;
      if (status >= 300 && status < 400) {
        const location = response.headers.location;
        if (location) {
          this.redirects.push({
            url: url,
            statusCode: status,
            headers: response.headers as Record<string, string>,
            type: "http",
          });

          const nextUrl = new URL(location, url).href;
          this.finalUrl = nextUrl;
          await this.analyzeWithRedirects(nextUrl, depth + 1);
        }
      } else {
        this.finalUrl = url;
      }
    } catch (error) {
      console.error("Error following redirect:", error);
      this.finalUrl = url;
    }
  }

  startTracking(initialUrl: string): void {
    this.redirects = [];
    this.finalUrl = initialUrl;
  }

  async analyze(url: string): Promise<RedirectAnalysis> {
    this.startTracking(url);
    await this.analyzeWithRedirects(url);

    if (this.redirects.length > 0) {
      this.redirects.unshift({
        url: url,
        statusCode: 200,
        headers: {},
        type: "http",
      });
    }

    if (this.redirects.length > 0 && this.finalUrl !== url) {
      this.redirects.push({
        url: this.finalUrl,
        statusCode: 200,
        headers: {},
        type: "http",
      });
    }

    return this.getAnalysis(this.finalUrl);
  }

  getAnalysis(finalUrl: string): RedirectAnalysis {
    const chain = this.redirects.filter((redirect, index, array) => {
      if (index === 0) return true;
      return redirect.url !== array[index - 1].url;
    });

    return {
      chain,
      finalUrl: finalUrl,
      totalRedirects: Math.max(0, chain.length - 1),
    };
  }
}
