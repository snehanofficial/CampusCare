type Listener<T = any> = (data: T) => void;

export class EventBus {
  private listeners: Record<string, Listener[]> = {};

  publish<T = any>(event: string, data?: T): void {
    const list = this.listeners[event];
    if (!list) return;
    list.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }

  subscribe<T = any>(event: string, callback: Listener<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe<T = any>(event: string, callback: Listener<T>): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter((listener) => listener !== callback);
  }
}

export const sharedEventBus = new EventBus();
