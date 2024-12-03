import { del, put } from "@vercel/blob";

export interface StorageService {
  upload(fileName: string, data: Buffer): Promise<{ url: string }>;
  delete?(url: string): Promise<void>;
}

export class VercelBlobStorage implements StorageService {
  async upload(fileName: string, data: Buffer) {
    const { url } = await put(fileName, data, {
      access: "public",
    });
    return { url };
  }

  async delete(url: string) {
    await del(url);
  }
}
