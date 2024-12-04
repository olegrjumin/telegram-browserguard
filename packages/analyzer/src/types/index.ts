export interface ContentAnalysis {
  purpose: string;
  risks: string[];
  isScam: boolean;
  riskScore: number;
  mainTopics: string[];
  targetAudience: string;
}

export interface RedirectData {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  type: "http" | "js" | "meta";
}

export interface RedirectAnalysis {
  chain: RedirectData[];
  finalUrl: string;
  totalRedirects: number;
}

export interface UnifiedReport {
  url: string;
  timestamp: number;
  screenshotBase64: string;
  contentAnalysis: ContentAnalysis;
  redirectAnalysis: RedirectAnalysis;
}
