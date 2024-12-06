import { StorageService } from "@/types";
import cron from "node-cron";

export class CleanupService {
  private cleanupJob: cron.ScheduledTask | null = null;

  constructor(private readonly storage: StorageService) {}

  start() {
    if (this.cleanupJob) {
      console.warn("Cleanup service already running");
      return;
    }

    // every hour
    this.cleanupJob = cron.schedule("0 * * * *", async () => {
      console.log("Starting hourly cleanup:", new Date().toISOString());
      await this.cleanup();
    });

    console.log("Cleanup service started");
  }

  stop() {
    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob = null;
      console.log("Cleanup service stopped");
    }
  }

  private async cleanup() {
    try {
      await this.storage.cleanupOldFiles?.();
    } catch (error) {
      console.error("Cleanup operation failed:", error);
    }
  }
}
