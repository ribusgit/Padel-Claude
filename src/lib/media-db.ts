/**
 * Almacén local de archivos (fotos y vídeos de técnica) en IndexedDB.
 * Los metadatos viven en el store principal; aquí solo se guardan los blobs,
 * que son demasiado grandes para localStorage.
 */
const DB_NAME = "escuela-padel-media";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMediaFile(id: string, file: Blob) {
  await tx("readwrite", (s) => s.put(file, id));
}

export async function getMediaFile(id: string): Promise<Blob | undefined> {
  try {
    return await tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
  } catch {
    return undefined;
  }
}

export async function deleteMediaFile(id: string) {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {
    /* ignorar */
  }
}
