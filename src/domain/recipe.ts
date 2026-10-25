/** Общий контракт для каталога, публикации и страницы рецепта. */
export interface Ingredient {
  id: string;
  name: string;
  /** null — количество не измеряется, например «по вкусу». */
  amount: number | null;
  unit: string;
  note?: string;
}

export interface Step {
  id: string;
  text: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  description?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  baseServings: number;
  ingredients: Ingredient[];
  steps: Step[];
  authorId: string;
  image?: {
    url: string;
    alt: string;
  };
  createdAt: string;
}

export const TEST_USER: User = {
  id: 'test-user',
  name: 'Тестовый пользователь',
};

export function getTotalTimeMinutes(recipe: Recipe): number {
  return recipe.prepTimeMinutes + recipe.cookTimeMinutes;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} ч` : `${hours} ч ${remainder} мин`;
}
