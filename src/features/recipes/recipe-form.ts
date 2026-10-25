import type { Recipe } from '../../domain/recipe';
import { TEST_USER } from '../../domain/recipe';

export interface IngredientValues {
  id: string;
  name: string;
  amount: string;
  unit: string;
  toTaste: boolean;
}
export interface RecipeFormValues {
  title: string;
  category: string;
  description: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  baseServings: string;
  imageUrl: string;
  imageAlt: string;
  ingredients: IngredientValues[];
  steps: { id: string; text: string }[];
}
export type FormErrors = Record<string, string>;
export const emptyIngredient = (): IngredientValues => ({
  id: crypto.randomUUID(), name: '', amount: '', unit: '', toTaste: false,
});
export const emptyStep = () => ({ id: crypto.randomUUID(), text: '' });
export const emptyRecipe = (): RecipeFormValues => ({
  title: '', category: '', description: '', prepTimeMinutes: '0', cookTimeMinutes: '',
  baseServings: '2', imageUrl: '', imageAlt: '',
  ingredients: [emptyIngredient()], steps: [emptyStep()],
});
export const parseAmount = (value: string) => Number(value.trim().replace(',', '.'));

export function validateRecipe(values: RecipeFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.title.trim()) errors.title = 'Введите название рецепта.';
  if (!values.category.trim()) errors.category = 'Укажите категорию блюда.';
  for (const key of ['prepTimeMinutes', 'cookTimeMinutes'] as const) {
    const value = Number(values[key]);
    if (!values[key].trim() || !Number.isSafeInteger(value) || value < 0) {
      errors[key] = 'Введите целое число минут, не меньше нуля.';
    }
  }
  if (!errors.prepTimeMinutes && !errors.cookTimeMinutes) {
    const total = Number(values.prepTimeMinutes) + Number(values.cookTimeMinutes);
    if (!Number.isSafeInteger(total) || total <= 0) {
      errors.cookTimeMinutes = 'Общее время подготовки и приготовления должно быть больше нуля.';
    }
  }
  if (!Number.isSafeInteger(Number(values.baseServings)) || Number(values.baseServings) < 1) {
    errors.baseServings = 'Введите целое число порций больше нуля.';
  }
  if (values.imageUrl.trim()) {
    try {
      const url = new URL(values.imageUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch { errors.imageUrl = 'Введите полный адрес изображения с https:// или http://.'; }
    if (!values.imageAlt.trim()) errors.imageAlt = 'Опишите, что изображено на фотографии.';
  }
  if (!values.ingredients.length) errors.ingredients = 'Добавьте хотя бы один ингредиент.';
  for (const item of values.ingredients) {
    if (!item.name.trim()) errors[`name-${item.id}`] = 'Введите название ингредиента.';
    if (!item.toTaste) {
      if (!Number.isFinite(parseAmount(item.amount)) || parseAmount(item.amount) <= 0) {
        errors[`amount-${item.id}`] = 'Введите количество больше нуля, например 0,5.';
      }
      if (!item.unit.trim()) errors[`unit-${item.id}`] = 'Укажите единицу измерения: г, мл, шт. или другую.';
    }
  }
  if (!values.steps.length) errors.steps = 'Добавьте хотя бы один шаг.';
  for (const step of values.steps) {
    if (!step.text.trim()) errors[`text-${step.id}`] = 'Опишите этот шаг приготовления.';
  }
  return errors;
}

export function toRecipe(values: RecipeFormValues): Recipe {
  return {
    id: crypto.randomUUID(), authorId: TEST_USER.id, createdAt: new Date().toISOString(),
    title: values.title.trim(), category: values.category.trim(),
    description: values.description.trim() || undefined,
    prepTimeMinutes: Number(values.prepTimeMinutes), cookTimeMinutes: Number(values.cookTimeMinutes),
    baseServings: Number(values.baseServings),
    image: values.imageUrl.trim() ? { url: values.imageUrl.trim(), alt: values.imageAlt.trim() } : undefined,
    ingredients: values.ingredients.map(item => ({
      id: item.id, name: item.name.trim(), amount: item.toTaste ? null : parseAmount(item.amount),
      unit: item.toTaste ? '' : item.unit.trim(), note: item.toTaste ? 'по вкусу' : undefined,
    })),
    steps: values.steps.map(step => ({ ...step, text: step.text.trim() })),
  };
}
