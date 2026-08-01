import { EventEmitter } from "events";
import { logger } from "./logger.js";

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(event: string, data?: any): void {
    logger.debug({ event, data }, `[EventBus] Publishing event: ${event}`);
    this.emit(event, data);
  }

  subscribe(event: string, callback: (...args: any[]) => void): () => void {
    logger.debug(`[EventBus] Subscribing to event: ${event}`);
    this.on(event, callback);
    return () => {
      logger.debug(`[EventBus] Unsubscribing from event: ${event}`);
      this.off(event, callback);
    };
  }
}

export const eventBus = new EventBus();
export default eventBus;
