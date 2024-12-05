import { UnifiedReport } from "@/types";
import { del, list, put } from "@vercel/blob";

export interface StorageService {
  upload(fileName: string, data: Buffer): Promise<{ url: string }>;
  delete?(url: string): Promise<void>;
  cleanupOldFiles?(): Promise<void>;
  storeUnifiedReport(
    userId: number,
    data: UnifiedReport
  ): Promise<{ url: string }>;
}

export class VercelBlobStorage implements StorageService {
  async upload(fileName: string, data: Buffer): Promise<{ url: string }> {
    const { url } = await put(fileName, data, {
      access: "public",
    });
    return { url };
  }

  async storeUnifiedReport(
    userId: number,
    data: UnifiedReport
  ): Promise<{ url: string }> {
    const date = new Date(data.timestamp);
    const hourTimestamp = date.toISOString().replace(/[-:]/g, "").slice(0, 10);
    const fileName = `users/${userId}/${hourTimestamp}/reports/${data.timestamp}.json`;

    const reportBuffer = Buffer.from(JSON.stringify(data));
    return this.upload(fileName, reportBuffer);
  }

  async cleanupOldFiles(): Promise<void> {
    try {
      const { blobs } = await list();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      console.log("Current time:", new Date().toISOString());

      const blobsToDelete = blobs.filter((blob) => {
        const uploadTime = new Date(blob.uploadedAt);
        const shouldDelete = uploadTime < oneHourAgo;
        return shouldDelete;
      });

      for (const blob of blobsToDelete) {
        console.log(`Deleting ${blob.pathname} uploaded at ${blob.uploadedAt}`);
        await this.delete(blob.url);
      }

      console.log(`Cleaned up ${blobsToDelete.length} old files`);
    } catch (error) {
      console.error("Cleanup operation failed:", error);
      throw error;
    }
  }

  async delete(url: string): Promise<void> {
    await del(url);
  }
}
