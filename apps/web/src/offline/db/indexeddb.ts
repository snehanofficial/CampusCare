export class IndexedDBHelper {
  private static dbName = "CampusCareOfflineDB";
  private static dbVersion = 1;

  /**
   * Initialize and upgrade the IndexedDB instance.
   */
  static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // 1. Pending actions queue store
        if (!db.objectStoreNames.contains("pending_actions")) {
          db.createObjectStore("pending_actions", { keyPath: "id" });
        }

        // 2. Sync metadata store
        if (!db.objectStoreNames.contains("sync_metadata")) {
          db.createObjectStore("sync_metadata", { keyPath: "key" });
        }

        // 3. Concurrency conflicts store
        if (!db.objectStoreNames.contains("conflicts")) {
          db.createObjectStore("conflicts", { keyPath: "id" });
        }

        // 4. Cached resource data store
        if (!db.objectStoreNames.contains("cached_data")) {
          db.createObjectStore("cached_data", { keyPath: "key" });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Put/Upsert an item inside the specified object store.
   */
  static async put(storeName: string, item: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetch an item from the specified object store by key.
   */
  static async get(storeName: string, key: string): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Delete an item from the specified object store by key.
   */
  static async delete(storeName: string, key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieve all items stored inside the specified object store.
   */
  static async getAll(storeName: string): Promise<any[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Wipe all records inside the object store.
   */
  static async clear(storeName: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
export default IndexedDBHelper;
