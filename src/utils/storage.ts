import { LocalHistoryItem, SerializedFile } from '../types';

const STORAGE_KEY = 'tmpdrop_local_history_v1';

export function getLocalHistory(): LocalHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: LocalHistoryItem[] = JSON.parse(raw);
    const now = Date.now();
    return items.filter(item => item.expiresAt > now);
  } catch (err) {
    console.error('Failed to read local history:', err);
    return [];
  }
}

export function saveToLocalHistory(files: SerializedFile[]) {
  try {
    const existing = getLocalHistory();
    const newItems: LocalHistoryItem[] = files.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      formattedSize: f.formattedSize,
      mimeType: f.mimeType,
      expiresAt: f.expiresAt,
      expirationPlan: f.expirationPlan,
      deleteToken: f.deleteToken || '',
      downloadUrl: f.downloadUrl,
      fileUrl: f.url,
      batchId: f.batchId,
      uploadedAt: f.uploadTimestamp,
    }));

    const map = new Map<string, LocalHistoryItem>();
    for (const item of newItems) {
      map.set(item.id, item);
    }
    for (const item of existing) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }

    const updated = Array.from(map.values()).slice(0, 150);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to local history:', err);
  }
}

export function removeFromLocalHistory(id: string) {
  try {
    const items = getLocalHistory().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to remove from local history:', err);
  }
}

export function clearLocalHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear local history:', err);
  }
}
