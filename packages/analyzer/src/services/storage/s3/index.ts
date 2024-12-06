// If we have time we can store images in s3 bucket
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { StorageService, UnifiedReport } from "@/types";

export class S3Storage implements StorageService {
  private client: S3Client;
  private bucketName: string;

  constructor(
    bucketName: string,
    region: string,
    credentials: { accessKeyId: string; secretAccessKey: string }
  ) {
    this.client = new S3Client({
      region,
      credentials,
    });
    this.bucketName = bucketName;
  }

  async upload(fileName: string, data: Buffer): Promise<{ url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: data,
      ContentType: this.getMimeType(fileName),
      ACL: "public-read", // Make file publicly accessible
    });
    await this.client.send(command);

    // Return the publicly accessible URL
    const url = `https://${this.bucketName}.s3.${this.client.config.region}.amazonaws.com/${fileName}`;
    return { url };
  }

  async delete(url: string): Promise<void> {
    const key = this.getKeyFromUrl(url);

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
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
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const command = new ListObjectsV2Command({ Bucket: this.bucketName });
      const { Contents } = await this.client.send(command);

      if (!Contents) return;

      const oldFiles = Contents.filter(
        (object) =>
          object.LastModified && new Date(object.LastModified) < oneHourAgo
      );

      for (const file of oldFiles) {
        if (file.Key) {
          console.log(
            `Deleting ${file.Key} last modified at ${file.LastModified}`
          );
          await this.delete(
            `https://${this.bucketName}.s3.${this.client.config.region}.amazonaws.com/${file.Key}`
          );
        }
      }

      console.log(`Cleaned up ${oldFiles.length} old files`);
    } catch (error) {
      console.error("Cleanup operation failed:", error);
      throw error;
    }
  }

  // Helper to determine MIME type
  private getMimeType(fileName: string): string {
    if (fileName.endsWith(".json")) return "application/json";
    if (fileName.endsWith(".png")) return "image/png";
    if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg"))
      return "image/jpeg";
    return "application/octet-stream";
  }

  // Helper to extract S3 key from URL
  private getKeyFromUrl(url: string): string {
    const urlParts = new URL(url);
    return urlParts.pathname.substring(1); // Remove leading "/"
  }
}
