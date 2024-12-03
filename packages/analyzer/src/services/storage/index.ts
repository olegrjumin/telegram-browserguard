import { StorageService, VercelBlobStorage } from "./vercel-blob";

export const storage: StorageService = new VercelBlobStorage();
