import { logger } from "../../../utils/logger.js";
import { MailerService } from "../mailer.service.js";
import { EmailLogService } from "../logs/email-log.service.js";
import type { EmailJob } from "../queue/email.queue.js";

export class EmailWorker {
  /**
   * Process a single queued email job, executing SMTP send and logging results.
   */
  static async processJob(job: EmailJob): Promise<void> {
    try {
      logger.info({ jobId: job.id, recipient: job.recipient, template: job.template }, "[EmailWorker] Processing job");

      // 1. Dispatch through SMTP mailer service
      await MailerService.sendMail(job.recipient, job.template, job.variables);

      // 2. Mark completed & record database transaction log
      job.status = "completed";
      await EmailLogService.log({
        recipient: job.recipient,
        template: job.template,
        status: "SENT",
        retryCount: job.retryCount,
        recipientType: job.recipientType,
        eventType: job.eventType,
        userId: job.userId,
      });

      logger.info({ jobId: job.id }, "[EmailWorker] Job completed successfully");
    } catch (err: any) {
      logger.error(err, `[EmailWorker] Job ${job.id} failed to send`);
      job.error = err.message || String(err);

      // 3. Retry loop with exponential back-off (Max 3 retries)
      if (job.retryCount < 3) {
        job.retryCount++;
        job.status = "pending"; // Re-enqueue for next cycle

        // Back-off delay
        const backoffMs = job.retryCount * 2000;
        logger.warn({ jobId: job.id, attempt: job.retryCount, delay: backoffMs }, "[EmailWorker] Scheduling retry attempt");
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        // Mark failed after exhausting all retries
        job.status = "failed";
        await EmailLogService.log({
          recipient: job.recipient,
          template: job.template,
          status: "FAILED",
          retryCount: job.retryCount,
          error: job.error,
          recipientType: job.recipientType,
          eventType: job.eventType,
          userId: job.userId,
        });

        logger.error({ jobId: job.id }, "[EmailWorker] Job failed permanently after exhausting all retries");
      }
    }
  }
}
export default EmailWorker;
