import { config } from "../project-config";
import { ScreenshotAPIResponse } from "../types";

export async function getScreenshot(
  query: string
): Promise<ScreenshotAPIResponse> {
  const url = config.ANALYZER_API_URL;
  const response = await fetch(`${url}/screenshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: query }),
  });

  const result = (await response.json()) as ScreenshotAPIResponse;
  return result;
}
