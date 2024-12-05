const createBlockedDomainsSet = () => {
  const domains = new Set([
    // Analytics & Tracking
    "google-analytics",
    "googletagmanager",
    "analytics",
    "segment.",
    "hotjar",
    "mouseflow",
    "doubleclick",
    "facebook.com/tr",
    "pixel",
    "tracking",

    // Ads
    "googlesyndication",
    "adroll",
    "adnxs",
    "advertising",

    // Chat & Support widgets
    "intercom",
    "drift.com",
    "zendesk",
    "livechat",
    "crisp.chat",
    "tawk.to",

    // Video embeds (often heavy)
    "youtube.com/embed",
    "vimeo.com/embed",
    "dailymotion.com/embed",

    // Marketing tools
    "marketo",
    "hubspot",
    "salesforce",
    "mailchimp",

    // Error tracking (non-visual)
    "sentry-cdn",
    "bugsnag",
    "rollbar",
  ]);

  return domains;
};

const blockedExtensions = new Set([
  ".mp4",
  ".mp3",
  ".avi",
  ".mov", // media files
  ".pdf",
  ".zip",
  ".gz",
  ".tar", // downloadable files
  ".exe",
  ".dmg",
  ".pkg", // executables
  ".xls",
  ".xlsx",
  ".doc",
  ".docx", // documents
]);

const blockedTypes = new Set([
  "media",
  "object",
  "beacon",
  "csp_report",
  "ping",
]);

export const shouldBlockRequest = (url: string, resourceType = "") => {
  if (resourceType === "document") {
    return false;
  }

  if (
    resourceType === "stylesheet" ||
    resourceType === "image" ||
    resourceType === "font"
  ) {
    return false;
  }

  if (blockedTypes.has(resourceType)) {
    return true;
  }

  const urlLower = url.toLowerCase();
  const extension = urlLower.substring(urlLower.lastIndexOf("."));
  if (blockedExtensions.has(extension)) {
    return true;
  }

  const blockedDomains = createBlockedDomainsSet();
  return [...blockedDomains].some((domain) => urlLower.includes(domain));
};
