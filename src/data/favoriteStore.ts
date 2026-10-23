export const FAVORITES_STORAGE_KEY = 'simpleCooking.favorites.v1';

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key === FAVORITES_STORAGE_KEY || event.key === null) {
    notifyListeners();
  }
}

export function getFavoriteIds(): string[] {
  const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (stored === null) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
    throw new Error('Сохранённое избранное имеет неверный формат.');
  }
  return [...new Set<string>(parsed)];
}

export function isFavorite(id: string): boolean {
  return getFavoriteIds().includes(id);
}

export function toggleFavorite(id: string): void {
  const ids = getFavoriteIds();
  const nextIds = ids.includes(id) ? ids.filter((favoriteId) => favoriteId !== id) : [...ids, id];
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextIds));
  notifyListeners();
}

/** Обновления работают в текущей вкладке и между открытыми вкладками. */
export function subscribeToFavorites(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}
