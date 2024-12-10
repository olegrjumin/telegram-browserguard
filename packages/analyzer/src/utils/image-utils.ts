export class ImageUtils {
  static base64ToBuffer(base64: string): Buffer {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  }

  static bufferToBase64(buffer: Buffer): string {
    return buffer.toString("base64");
  }

  static addBase64Prefix(base64: string, format: string = "png"): string {
    if (base64.startsWith("data:image/")) {
      return base64;
    }
    return `data:image/${format};base64,${base64}`;
  }
}
