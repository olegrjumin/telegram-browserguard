import { Page } from "puppeteer-core";
import { shouldBlockRequest } from "../screenshot/blocking-rules";

export interface RequestMetrics {
  blocked: number;
  allowed: number;
  total: number;
}

export class RequestMonitor {
  private metrics: RequestMetrics = {
    blocked: 0,
    allowed: 0,
    total: 0,
  };

  attachToPage(page: Page): void {
    page.on("request", (request) => {
      if (shouldBlockRequest(request.url())) {
        this.metrics.blocked++;
        request.abort();
      } else {
        this.metrics.allowed++;
        request.continue();
      }
      this.metrics.total = this.metrics.blocked + this.metrics.allowed;
    });
  }

  getMetrics(): RequestMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      blocked: 0,
      allowed: 0,
      total: 0,
    };
  }
}
