import crypto from "crypto";
import { logger } from "../../../utils/logger.js";
import { EmailWorker } from "../jobs/email.worker.js";

export interface EmailJob {
  id: string;
  recipient: string;
  template: string;
  variables: Record<string, any>;
  retryCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  createdAt: Date;
  recipientType?: string;
  eventType?: string;
  userId?: string;
}

export class EmailQueue {
  private static queue: EmailJob[] = [];
  private static isProcessing = false;

  /**
   * Push a new email job into the queue and trigger worker processing.
   */
  static async enqueue(
    recipient: string,
    template: string,
    variables: Record<string, any>,
    metadata?: {
      recipientType?: string;
      eventType?: string;
      userId?: string;
    }
  ): Promise<string> {
    const job: EmailJob = {
      id: crypto.randomUUID(),
      recipient,
      template,
      variables,
      retryCount: 0,
      status: "pending",
      createdAt: new Date(),
      recipientType: metadata?.recipientType,
      eventType: metadata?.eventType,
      userId: metadata?.userId,
    };

    this.queue.push(job);
    logger.info({ jobId: job.id, recipient, template }, "[EmailQueue] Enqueued email job");

    // Asynchronously kick-start processing
    this.processQueue().catch((err) => {
      logger.error(err, "[EmailQueue] Error during queue processing trigger");
    });

    return job.id;
  }

  /**
   * Queue processor loop. Processes pending jobs sequentially.
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        const nextJob = this.queue.find((job) => job.status === "pending");
        if (!nextJob) break;

        nextJob.status = "processing";
        await EmailWorker.processJob(nextJob);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Helper to inspect the current queue in memory (useful for testing/status).
   */
  static getQueueStatus() {
    return {
      pending: this.queue.filter((j) => j.status === "pending").length,
      processing: this.queue.filter((j) => j.status === "processing").length,
      completed: this.queue.filter((j) => j.status === "completed").length,
      failed: this.queue.filter((j) => j.status === "failed").length,
      total: this.queue.length,
      jobs: this.queue.map((j) => ({
        id: j.id,
        recipient: j.recipient,
        template: j.template,
        status: j.status,
        retryCount: j.retryCount,
      })),
    };
  }
}
export default EmailQueue;
