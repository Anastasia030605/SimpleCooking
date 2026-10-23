import type { Recipe } from '../domain/recipe';
import { seedRecipes } from './seedRecipes';

export const RECIPES_STORAGE_KEY = 'simpleCooking.recipes.v1';

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key === RECIPES_STORAGE_KEY || event.key === null) {
    notifyListeners();
  }
}

function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== 'object' || value === null) return false;
  const recipe = value as Partial<Recipe>;
  return typeof recipe.id === 'string'
    && typeof recipe.title === 'string'
    && typeof recipe.category === 'string'
    && typeof recipe.prepTimeMinutes === 'number'
    && typeof recipe.cookTimeMinutes === 'number'
    && typeof recipe.baseServings === 'number'
    && Array.isArray(recipe.ingredients)
    && Array.isArray(recipe.steps);
}

/** Чтение оставлено синхронным: localStorage не требует сетевого запроса. */
export function getRecipes(): Recipe[] {
  const stored = window.localStorage.getItem(RECIPES_STORAGE_KEY);
  if (stored === null) return seedRecipes;

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isRecipe)) {
    throw new Error('Сохранённые рецепты имеют неверный формат.');
  }
  return parsed;
}

export function getRecipeById(id: string): Recipe | undefined {
  return getRecipes().find((recipe) => recipe.id === id);
}

/** Для формы публикации: рецепт сохраняется и сразу появляется в каталоге. */
export function saveRecipe(recipe: Recipe): void {
  const recipes = getRecipes();
  if (recipes.some((existing) => existing.id === recipe.id)) {
    throw new Error('Рецепт с таким идентификатором уже существует.');
  }
  window.localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify([recipe, ...recipes]));
  notifyListeners();
}

/** Обновления работают в текущей вкладке и между открытыми вкладками. */
export function subscribeToRecipes(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}
