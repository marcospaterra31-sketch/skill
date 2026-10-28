export interface ZipCacheEntry {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  createdAt: number;
}

export class ZipExportCache {
  private cache = new Map<string, ZipCacheEntry>();
  private readonly maxItems: number;
  private readonly ttlMs: number;

  constructor(maxItems = 50, ttlMs = 15 * 60 * 1000) {
    this.maxItems = maxItems;
    this.ttlMs = ttlMs;

    // Limpeza periódica a cada 60s
    const timer = setInterval(() => this.cleanExpired(), 60 * 1000);
    if (timer.unref) timer.unref();
  }

  set(id: string, entry: Omit<ZipCacheEntry, 'createdAt'>) {
    this.cleanExpired();

    // Se atingiu o limite de capacidade de 50 itens, remove o mais antigo
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(id, {
      ...entry,
      createdAt: Date.now(),
    });
  }

  get(id: string): ZipCacheEntry | null {
    const item = this.cache.get(id);
    if (!item) return null;

    if (Date.now() - item.createdAt > this.ttlMs) {
      this.cache.delete(id);
      return null;
    }

    return item;
  }

  has(id: string): boolean {
    return this.get(id) !== null;
  }

  delete(id: string): boolean {
    return this.cache.delete(id);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  cleanExpired(): number {
    const now = Date.now();
    let removed = 0;
    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.ttlMs) {
        this.cache.delete(id);
        removed++;
      }
    }
    return removed;
  }
}

export const exportBuffersCache = new ZipExportCache(50, 15 * 60 * 1000);
