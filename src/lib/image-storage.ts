/**
 * IndexedDB storage for FixIt ticket attachments.
 * Allows storing full photos with gigabytes of available quota,
 * bypassing the strict 5MB window.localStorage limit.
 */

const DB_NAME = "campusos_fixit_media";
const DB_VERSION = 1;
const STORE_NAME = "ticket_photos";

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "ticketId" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function storePhotoInIdb(ticketId: string, photoDataUrl: string): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ ticketId, photoDataUrl, savedAt: Date.now() });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getPhotoFromIdb(ticketId: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(ticketId);
      req.onsuccess = () => {
        const result = req.result;
        resolve(result?.photoDataUrl || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
