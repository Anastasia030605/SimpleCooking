import { useCallback, useEffect, useState } from 'react';
import type { Recipe } from '../domain/recipe';
import { getRecipes, subscribeToRecipes } from './recipeStore';

type RecipeState =
  | { status: 'loading'; recipes: Recipe[]; error: null }
  | { status: 'ready'; recipes: Recipe[]; error: null }
  | { status: 'error'; recipes: Recipe[]; error: string };

export function useRecipes(): RecipeState & { retry: () => void } {
  const [state, setState] = useState<RecipeState>({
    status: 'loading',
    recipes: [],
    error: null,
  });

  const refresh = useCallback(() => {
    try {
      setState({ status: 'ready', recipes: getRecipes(), error: null });
    } catch {
      setState({
        status: 'error',
        recipes: [],
        error: 'Не удалось прочитать сохранённые рецепты. Проверьте данные браузера и попробуйте ещё раз.',
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToRecipes(refresh);
    refresh();
    return unsubscribe;
  }, [refresh]);

  return { ...state, retry: refresh };
}
