import { Page } from "puppeteer-core";

export const LOADING_SELECTORS = [
  // Common loading spinners/animations
  '[class*="loading"]',
  '[class*="spinner"]',
  '[class*="progress"]',
  '[id*="loading"]',
  '[id*="spinner"]',
  '[role="progressbar"]',

  // Skeleton screens
  '[class*="skeleton"]',
  '[class*="placeholder"]',
  '[class*="shimmer"]',

  // Common loading text patterns
  "text/Loading...",
  "text/Please wait",
  "text/Loading",

  // Twitter specific (can be moved to site-specific rules later)
  '[aria-label*="Loading"]',
  '[class*="LoadingState"]',

  // Common loading animations
  '*[style*="animation"]',
  ".animate-pulse",
  ".animate-spin",
];

export const CONTENT_READY_SIGNALS = [
  // Check for meaningful content
  "article",
  "main",
  '[role="main"]',
  ".post-content",
  ".article-content",
  // Twitter specific
  '[data-testid="tweet"]',
  '[data-testid="tweetText"]',
];

export async function isLoadingVisible(page: Page) {
  const loadingElements = await Promise.all(
    LOADING_SELECTORS.map(async (selector) => {
      if (selector.startsWith("text/")) {
        const textToFind = selector.replace("text/", "");
        return await page.evaluate((text) => {
          return Array.from(document.querySelectorAll("*")).some(
            (el) =>
              el.textContent?.includes(text) &&
              (el as HTMLElement).offsetParent !== null
          );
        }, textToFind);
      } else {
        return await page.evaluate((sel) => {
          const elements = document.querySelectorAll(sel);
          return Array.from(elements).some((el) => {
            const style = window.getComputedStyle(el);
            return (
              (el as HTMLElement).offsetParent !== null &&
              style.visibility !== "hidden" &&
              style.display !== "none" &&
              style.opacity !== "0"
            );
          });
        }, selector);
      }
    })
  );

  return loadingElements.some(Boolean);
}

export async function hasContentLoaded(page: Page) {
  const contentElements = await Promise.all(
    CONTENT_READY_SIGNALS.map(async (selector) => {
      const elements = await page.$$(selector);
      return elements.length > 0;
    })
  );

  return contentElements.some(Boolean);
}

export async function waitForLoadingComplete(
  page: Page,
  { maxWaitTime = 5000, checkInterval = 100 } = {}
) {
  const startTime = Date.now();
  let contentFound = false;

  while (Date.now() - startTime < maxWaitTime) {
    contentFound = await hasContentLoaded(page);

    if (contentFound) {
      const isLoading = await isLoadingVisible(page);
      if (!isLoading) {
        return { success: true, timeSpent: Date.now() - startTime };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  return {
    success: contentFound,
    timeSpent: Date.now() - startTime,
    timedOut: true,
  };
}
