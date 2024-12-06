import { config } from "@/project-config";
import {
  AllAPIResponse,
  RawDataResponse,
  SaveReportInput,
  SaveReportResponse,
  ScreenshotAPIResponse,
} from "@/types/api";

export async function getScreenshot(url: string) {
  const response = await fetch(`${config.ANALYZER_API_URL}/screenshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();
  return data as ScreenshotAPIResponse;
}

export async function getAll(url: string, userId: number) {
  const response = await fetch(`${config.ANALYZER_API_URL}/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, userId }),
  });

  const data = await response.json();
  return data as AllAPIResponse;
}

export const getRawData = async (url: string) => {
  try {
    const response = await fetch(`${config.ANALYZER_API_URL}/raw?url=${url}`);
    const data = await response.json();
    return data as RawDataResponse;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const saveReport = async (input: SaveReportInput) => {
  const response = await fetch(`${config.ANALYZER_API_URL}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  return data as SaveReportResponse;
};
