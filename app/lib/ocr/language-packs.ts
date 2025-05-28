/**
 * Language pack management for Tesseract.js
 * Handles downloading, caching, and validation of language packs
 */

import type {
  LanguagePackConfig,
  LanguagePackDownloadProgress,
} from './ocr-types';

// Available language packs configuration
export const AVAILABLE_LANGUAGE_PACKS: Record<string, LanguagePackConfig> = {
  ron: {
    code: 'ron',
    name: 'Romanian',
    url: 'https://github.com/tesseract-ocr/tessdata/raw/main/ron.traineddata',
    size: 14_500_000, // ~14.5MB
    version: '4.1.0',
    isDownloaded: false,
  },
  eng: {
    code: 'eng',
    name: 'English',
    url: 'https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata',
    size: 13_800_000, // ~13.8MB
    version: '4.1.0',
    isDownloaded: false,
  },
  // Combined Romanian + English for better accuracy
  'ron+eng': {
    code: 'ron+eng',
    name: 'Romanian + English',
    url: '', // Will use both individual packs
    size: 28_300_000, // Combined size
    version: '4.1.0',
    isDownloaded: false,
  },
};

// Default language pack configuration
export const DEFAULT_LANGUAGE_PACK = 'ron';
export const FALLBACK_LANGUAGE_PACK = 'eng';

// Language pack storage paths
export const TESSDATA_PATH = '/tessdata/';
export const LANGUAGE_PACK_CACHE_KEY = 'tesseract_language_packs';

/**
 * Language pack manager class
 */
export class LanguagePackManager {
  private downloadProgress = new Map<string, LanguagePackDownloadProgress>();
  private downloadPromises = new Map<string, Promise<boolean>>();

  /**
   * Check if a language pack is available locally
   */
  async isLanguagePackAvailable(langCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${TESSDATA_PATH}${langCode}.traineddata`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available language packs
   */
  getAvailableLanguagePacks(): LanguagePackConfig[] {
    return Object.values(AVAILABLE_LANGUAGE_PACKS);
  }

  /**
   * Get language pack configuration
   */
  getLanguagePackConfig(langCode: string): LanguagePackConfig | null {
    return AVAILABLE_LANGUAGE_PACKS[langCode] || null;
  }

  /**
   * Download a language pack with progress tracking
   */
  async downloadLanguagePack(
    langCode: string,
    onProgress?: (_progress: LanguagePackDownloadProgress) => void
  ): Promise<boolean> {
    // Return existing promise if download is already in progress
    if (this.downloadPromises.has(langCode)) {
      return this.downloadPromises.get(langCode)!;
    }

    const downloadPromise = this._performDownload(langCode, onProgress);
    this.downloadPromises.set(langCode, downloadPromise);

    try {
      const result = await downloadPromise;
      return result;
    } finally {
      this.downloadPromises.delete(langCode);
      this.downloadProgress.delete(langCode);
    }
  }

  /**
   * Internal download implementation
   */
  private async _performDownload(
    langCode: string,
    onProgress?: (_progress: LanguagePackDownloadProgress) => void
  ): Promise<boolean> {
    const config = this.getLanguagePackConfig(langCode);
    if (!config || !config.url) {
      throw new Error(`Language pack not found: ${langCode}`);
    }

    // Check if already downloaded
    if (await this.isLanguagePackAvailable(langCode)) {
      return true;
    }

    try {
      const startTime = Date.now();
      const response = await fetch(config.url);

      if (!response.ok) {
        throw new Error(
          `Failed to download language pack: ${response.statusText}`
        );
      }

      const contentLength = parseInt(
        response.headers.get('content-length') || '0'
      );
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      let reading = true;
      while (reading) {
        const { done, value } = await reader.read();

        if (done) {
          reading = false;
          break;
        }

        chunks.push(value);
        loaded += value.length;

        // Calculate progress
        const now = Date.now();
        const elapsed = (now - startTime) / 1000; // seconds
        const speed = loaded / elapsed; // bytes per second
        const percentage =
          contentLength > 0 ? (loaded / contentLength) * 100 : 0;
        const estimatedTimeRemaining =
          contentLength > 0 ? (contentLength - loaded) / speed : 0;

        const progress: LanguagePackDownloadProgress = {
          loaded,
          total: contentLength,
          percentage,
          speed,
          estimatedTimeRemaining,
        };

        this.downloadProgress.set(langCode, progress);
        onProgress?.(progress);
      }

      // Combine chunks into single array
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedArray = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }

      // Store in browser cache/IndexedDB for offline access
      await this.storeLanguagePack(langCode, combinedArray);

      // Update configuration
      config.isDownloaded = true;
      this.saveLanguagePacksConfig();

      return true;
    } catch (error) {
      console.error(`Failed to download language pack ${langCode}:`, error);
      throw error;
    }
  }

  /**
   * Store language pack data locally
   */
  private async storeLanguagePack(
    langCode: string,
    data: Uint8Array
  ): Promise<void> {
    try {
      // Use IndexedDB for large file storage
      const dbName = 'tesseract-language-packs';
      const storeName = 'language-packs';

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onerror = () => reject(request.error);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);

          const putRequest = store.put(data, langCode);

          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        };
      });
    } catch (error) {
      console.error(`Failed to store language pack ${langCode}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve language pack data from local storage
   */
  async getStoredLanguagePack(langCode: string): Promise<Uint8Array | null> {
    try {
      const dbName = 'tesseract-language-packs';
      const storeName = 'language-packs';

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);

          const getRequest = store.get(langCode);

          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => {
            resolve(getRequest.result || null);
          };
        };
      });
    } catch (error) {
      console.error(`Failed to retrieve language pack ${langCode}:`, error);
      return null;
    }
  }

  /**
   * Delete a language pack from local storage
   */
  async deleteLanguagePack(langCode: string): Promise<boolean> {
    try {
      const dbName = 'tesseract-language-packs';
      const storeName = 'language-packs';

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);

          const deleteRequest = store.delete(langCode);

          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => {
            // Update configuration
            const config = this.getLanguagePackConfig(langCode);
            if (config) {
              config.isDownloaded = false;
              this.saveLanguagePacksConfig();
            }
            resolve(true);
          };
        };
      });
    } catch (error) {
      console.error(`Failed to delete language pack ${langCode}:`, error);
      return false;
    }
  }

  /**
   * Get download progress for a language pack
   */
  getDownloadProgress(langCode: string): LanguagePackDownloadProgress | null {
    return this.downloadProgress.get(langCode) || null;
  }

  /**
   * Check if download is in progress
   */
  isDownloadInProgress(langCode: string): boolean {
    return this.downloadPromises.has(langCode);
  }

  /**
   * Save language packs configuration to localStorage
   */
  private saveLanguagePacksConfig(): void {
    try {
      localStorage.setItem(
        LANGUAGE_PACK_CACHE_KEY,
        JSON.stringify(AVAILABLE_LANGUAGE_PACKS)
      );
    } catch (error) {
      console.warn('Failed to save language packs configuration:', error);
    }
  }

  /**
   * Load language packs configuration from localStorage
   */
  loadLanguagePacksConfig(): void {
    try {
      const stored = localStorage.getItem(LANGUAGE_PACK_CACHE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        Object.assign(AVAILABLE_LANGUAGE_PACKS, config);
      }
    } catch (error) {
      console.warn('Failed to load language packs configuration:', error);
    }
  }

  /**
   * Get total storage size used by language packs
   */
  async getStorageSize(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all language pack data
   */
  async clearAllLanguagePacks(): Promise<void> {
    try {
      const dbName = 'tesseract-language-packs';

      return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onsuccess = () => {
          // Reset configuration
          Object.values(AVAILABLE_LANGUAGE_PACKS).forEach(config => {
            config.isDownloaded = false;
          });
          this.saveLanguagePacksConfig();
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to clear language packs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const languagePackManager = new LanguagePackManager();
