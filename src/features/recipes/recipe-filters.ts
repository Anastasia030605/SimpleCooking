import { getTotalTimeMinutes } from '../../domain/recipe';
import type { Recipe } from '../../domain/recipe';

export interface IngredientFilters {
  included: string[];
  excluded: string[];
  mode: 'all' | 'any';
}

export interface IngredientOption {
  value: string;
  label: string;
}

interface RecipeFilters {
  search: string;
  maxMinutes: number | null;
  ingredients: IngredientFilters;
}

function cleanIngredientName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeIngredientName(name: string): string {
  return cleanIngredientName(name).toLocaleLowerCase('ru');
}

/** Ingredient.id относится к строке рецепта, поэтому сравниваем названия продуктов. */
export function getIngredientOptions(recipes: readonly Recipe[], selectedNames: readonly string[] = []): IngredientOption[] {
  const options = new Map<string, string>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const value = normalizeIngredientName(ingredient.name);
      if (value && !options.has(value)) options.set(value, cleanIngredientName(ingredient.name));
    }
  }
  // Выбранный продукт остаётся доступным для снятия даже после удаления его рецептов.
  for (const name of selectedNames) {
    const value = normalizeIngredientName(name);
    if (value && !options.has(value)) options.set(value, cleanIngredientName(name));
  }
  return Array.from(options, ([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

export function filterRecipes(recipes: readonly Recipe[], filters: RecipeFilters): Recipe[] {
  const query = filters.search.trim().toLocaleLowerCase('ru');
  const included = filters.ingredients.included.map(normalizeIngredientName);
  const excluded = filters.ingredients.excluded.map(normalizeIngredientName);

  return recipes.filter((recipe) => {
    if (query && !recipe.title.toLocaleLowerCase('ru').includes(query)) return false;
    if (filters.maxMinutes !== null && getTotalTimeMinutes(recipe) > filters.maxMinutes) return false;
    const names = new Set(recipe.ingredients.map((ingredient) => normalizeIngredientName(ingredient.name)));
    if (excluded.some((name) => names.has(name))) return false;
    return included.length === 0 || (filters.ingredients.mode === 'all'
      ? included.every((name) => names.has(name))
      : included.some((name) => names.has(name)));
  });
}
