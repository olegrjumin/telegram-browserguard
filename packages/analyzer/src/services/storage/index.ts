import { StorageService, VercelBlobStorage } from "./vercel-blob";

export class StorageFactory {
  static createStorage(type: "vercel-blob"): StorageService {
    switch (type) {
      case "vercel-blob":
        return new VercelBlobStorage();
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}

export const storage = StorageFactory.createStorage("vercel-blob");
