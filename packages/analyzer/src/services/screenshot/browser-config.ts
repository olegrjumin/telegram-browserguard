import chromium from "@sparticuz/chromium";
import fs from "fs";
import {
  PuppeteerLaunchOptions,
  ScreenshotOptions,
  WaitForOptions,
} from "puppeteer-core";
import { SupportedFormat, SupportedPlatforms } from "./types";

const chromePaths: Record<SupportedPlatforms, string[]> = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Canary",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"],
};

const browserArgs = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu",
  "--disable-web-security",
  "--aggressive-cache-discard",
  "--disable-cache",
  "--disable-application-cache",
  "--disable-offline-load-stale-cache",
  "--disk-cache-size=0",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--disable-translate",
  "--hide-scrollbars",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-first-run",
  "--safebrowsing-disable-auto-update",
];

const viewport = {
  width: 1280,
  height: 720,
  deviceScaleFactor: 0.75,
};

const navigation: WaitForOptions = {
  waitUntil: ["domcontentloaded"],
  timeout: 15000,
};

function findChromePath() {
  const platform = process.platform as SupportedPlatforms;
  const platformPaths = chromePaths[platform] || chromePaths.linux;

  for (const path of platformPaths) {
    if (fs.existsSync(path)) {
      console.log(`Found Chrome at: ${path}`);
      return path;
    }
  }
  throw new Error(
    "Chrome executable not found. Please install Chrome browser."
  );
}

async function getBrowserConfig() {
  const options: PuppeteerLaunchOptions = {
    headless: true,
    args: browserArgs,
    defaultViewport: viewport,
  };

  if (process.env.NODE_ENV === "production") {
    options.executablePath = await chromium.executablePath();
    options.args = [...(options.args || []), ...chromium.args];
  } else {
    try {
      options.executablePath = findChromePath();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to find Chrome:", error.message);
      } else {
        console.error("Failed to find Chrome:", error);
      }
      console.log("Falling back to bundled chromium...");
      options.executablePath = await chromium.executablePath();
    }
  }

  return options;
}

const getScreenshotOptions = (
  format: SupportedFormat = "jpeg",
  quality = 60
): ScreenshotOptions => ({
  fullPage: false,
  encoding: "base64",
  type: format,
  quality: format === "jpeg" ? quality : undefined,
  omitBackground: false,
});

export const browserConfig = {
  getBrowserConfig,
  findChromePath,
  viewport,
  navigation,
  getScreenshotOptions,
};
