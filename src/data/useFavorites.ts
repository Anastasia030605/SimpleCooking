import { useCallback, useEffect, useState } from 'react';
import { getFavoriteIds, subscribeToFavorites, toggleFavorite } from './favoriteStore';

interface FavoriteState {
  status: 'loading' | 'ready' | 'error';
  favoriteIds: string[];
  error: string | null;
}

export function useFavorites() {
  const [state, setState] = useState<FavoriteState>({
    status: 'loading',
    favoriteIds: [],
    error: null,
  });

  const refresh = useCallback(() => {
    try {
      setState({ status: 'ready', favoriteIds: getFavoriteIds(), error: null });
    } catch {
      setState({
        status: 'error',
        favoriteIds: [],
        error: 'Не удалось прочитать избранное. Проверьте данные браузера и попробуйте ещё раз.',
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToFavorites(refresh);
    refresh();
    return unsubscribe;
  }, [refresh]);

  function toggle(id: string): boolean | null {
    if (state.status !== 'ready') return null;

    const selected = !state.favoriteIds.includes(id);
    const favoriteIds = selected
      ? [...state.favoriteIds, id]
      : state.favoriteIds.filter((favoriteId) => favoriteId !== id);

    setState({ status: 'ready', favoriteIds, error: null });
    try {
      toggleFavorite(id);
      return selected;
    } catch {
      setState({
        ...state,
        error: 'Не удалось сохранить избранное. Изменение отменено. Попробуйте ещё раз.',
      });
      return null;
    }
  }

  return { ...state, retry: refresh, toggle };
}
