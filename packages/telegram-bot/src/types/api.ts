import {
  ContentAnalysis,
  RiskAssessment,
  SecurityAnalysisInput,
} from "./server";

export type AllAPIResponse = {
  imageBuffer: Buffer;
  blobUrl: string;
  contentAnalysisRiskScore: number;
  securityAnalysisRiskScore: number;
};
export type ScreenshotAPIResponse = {
  imageBuffer: Buffer;
  contentAnalysis: ContentAnalysis;
};

export type SaveReportInput = {
  url: string;
  userId: number;
  screenshotBase64: string;
  contentAnalysis: ContentAnalysis;
  securityData: SecurityAnalysisInput;
  securityAnalysis: RiskAssessment;
};

export type SaveReportResponse = { blobUrl: string };

export type RawDataResponse = {
  securityData: SecurityAnalysisInput;
  securityAnalysis: RiskAssessment;
};
