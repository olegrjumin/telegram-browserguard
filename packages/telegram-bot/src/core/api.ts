import { config } from "../project-config";
import { ScreenshotAPIResponse } from "../types";

export async function getScreenshot({
  userId,
  url,
}: {
  userId: number;
  url: string;
}): Promise<{ buffer: ScreenshotAPIResponse["imageBuffer"] }> {
  const response = await fetch(`${config.ANALYZER_API_URL}/screenshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, userId }),
  });

  const result = (await response.json()) as ScreenshotAPIResponse;

  return { buffer: Buffer.from(result.imageBuffer) };
}
