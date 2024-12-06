import { S3Config, StorageService } from "@/types";
import { VercelBlobStorage } from "./vercel-blob";
import { S3Storage } from "./s3";
import s3Config from "./s3/config";

export class StorageFactory {
  static createStorage(
    type: "vercel-blob" | "s3",
    config?: S3Config
  ): StorageService {
    switch (type) {
      case "vercel-blob":
        return new VercelBlobStorage();
      case "s3":
        if (!config) {
          throw new Error("S3 configuration is required.");
        }
        return new S3Storage(
          config.bucketName,
          config.region,
          config.credentials
        );
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}

export const storage = StorageFactory.createStorage("s3", s3Config);
