// ===================== CONTENT CACHE (IndexedDB + ETag) =====================
// localStorage cannot hold the LU catalog (~5MB+). IndexedDB stores hierarchy /
// offering slices keyed by ETag so revalidate can short-circuit with 304.
// When IndexedDB is missing (tests / private mode), fall back to an in-memory Map.

const _DB_NAME = "lu_links_cache";
const _DB_VERSION = 1;
const _STORE = "content";
const _CACHE_TTL = 60 * 60 * 1000;

/** @type {Map<string, { key: string, data: any, etag: string, ts: number }>} */
const _mem = new Map();

let _dbPromise = null;

function _openDB() {
  if (_dbPromise) return _dbPromise;
  if (typeof indexedDB === "undefined") {
    _dbPromise = Promise.resolve(null);
    return _dbPromise;
  }
  _dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(_DB_NAME, _DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(_STORE)) {
          db.createObjectStore(_STORE, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return _dbPromise;
}

async function _idbGet(key) {
  const db = await _openDB();
  if (!db) return _mem.get(key) || null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(_STORE, "readonly");
      const req = tx.objectStore(_STORE).get(key);
      req.onsuccess = () => {
        const row = req.result;
        if (row) resolve(row);
        else resolve(_mem.get(key) || null);
      };
      req.onerror = () => resolve(_mem.get(key) || null);
    } catch {
      resolve(_mem.get(key) || null);
    }
  });
}

async function _idbPut(entry) {
  _mem.set(entry.key, entry);
  const db = await _openDB();
  if (!db) return true;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(_STORE, "readwrite");
      tx.objectStore(_STORE).put(entry);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true); // memory already holds it
    } catch {
      resolve(true);
    }
  });
}

async function _idbClear() {
  _mem.clear();
  const db = await _openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(_STORE, "readwrite");
      tx.objectStore(_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** @returns {Promise<{ data: any, etag: string, stale: boolean } | null>} */
async function _loadCache(key = "hierarchy") {
  const row = await _idbGet(key);
  if (!row || !row.data) return null;
  const stale = !row.ts || Date.now() - row.ts > _CACHE_TTL;
  return { data: row.data, etag: row.etag || "", stale };
}

async function _saveCache(data, { key = "hierarchy", etag = "" } = {}) {
  await _idbPut({
    key,
    data,
    etag: etag || "",
    ts: Date.now(),
  });
}

async function _clearCache() {
  await _idbClear();
  // Drop legacy localStorage blobs that used to OOM / QuotaExceeded.
  try {
    localStorage.removeItem("lu_links_data");
    localStorage.removeItem("lu_links_cache_ts");
  } catch {
    /* ignore */
  }
}

export { _saveCache, _loadCache, _clearCache };
