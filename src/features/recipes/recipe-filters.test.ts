import { describe, expect, it } from 'vitest';
import { seedRecipes } from '../../data/seedRecipes';
import type { Recipe } from '../../domain/recipe';
import { filterRecipes, getIngredientOptions } from './recipe-filters';
import type { IngredientFilters } from './recipe-filters';

function recipe(id: string, title: string, names: string[], total: number): Recipe {
  return { ...seedRecipes[0], id, title, prepTimeMinutes: 5, cookTimeMinutes: total - 5,
    ingredients: names.map((name, index) => ({ id: `${id}-${index}`, name, amount: null, unit: '', note: 'по вкусу' })) };
}

const recipes = [
  recipe('tomato', 'Салат с томатами', ['Томаты', 'Огурец', 'Соль'], 10),
  recipe('pepper', 'Салат с перцем', [' огурец ', 'Сладкий   перец'], 20),
  recipe('pasta', 'Паста с помидорами', ['Помидоры', 'СЛАДКИЙ ПЕРЕЦ'], 30),
];
const empty: IngredientFilters = { included: [], excluded: [], mode: 'all' };
function ids(ingredients: IngredientFilters, search = '', maxMinutes: number | null = null) {
  return filterRecipes(recipes, { ingredients, search, maxMinutes }).map((item) => item.id);
}

describe('Фильтрация рецептов по ингредиентам', () => {
  it('собирает отсортированные продукты без повторов по регистру и пробелам', () => {
    expect(getIngredientOptions(recipes)).toEqual([
      { value: 'огурец', label: 'Огурец' },
      { value: 'помидоры', label: 'Помидоры' },
      { value: 'сладкий перец', label: 'Сладкий перец' },
      { value: 'соль', label: 'Соль' },
      { value: 'томаты', label: 'Томаты' },
    ]);
  });

  it('требует все выбранные продукты независимо от ID строк ингредиентов', () => {
    expect(ids({ ...empty, included: ['томаты', 'огурец'] })).toEqual(['tomato']);
    expect(ids({ ...empty, included: ['огурец'] })).toEqual(['tomato', 'pepper']);
  });

  it('в режиме «хотя бы один» достаточно одного совпадения', () => {
    expect(ids({ ...empty, mode: 'any', included: ['томаты', 'сладкий перец'] }))
      .toEqual(['tomato', 'pepper', 'pasta']);
  });

  it.each(['all', 'any'] as const)('пустые списки не ограничивают выдачу в режиме %s', (mode) => {
    expect(ids({ ...empty, mode })).toEqual(['tomato', 'pepper', 'pasta']);
  });

  it('исключает рецепт при наличии любого запрещённого продукта в обоих режимах', () => {
    for (const mode of ['all', 'any'] as const) {
      expect(ids({ included: ['огурец'], excluded: ['томаты', 'помидоры'], mode })).toEqual(['pepper']);
    }
    expect(ids({ ...empty, excluded: ['томаты', 'сладкий перец'] })).toEqual([]);
  });

  it('совмещает ингредиенты, название и общее время без изменения исходных рецептов', () => {
    const original = JSON.stringify(recipes);
    const ingredients: IngredientFilters = { included: ['огурец'], excluded: ['томаты'], mode: 'all' };
    expect(ids(ingredients, ' САЛАТ ', 20)).toEqual(['pepper']);
    expect(ids(ingredients, 'салат', 19)).toEqual([]);
    expect(ids(ingredients, 'паста', 30)).toEqual([]);
    expect(JSON.stringify(recipes)).toBe(original);
  });

  it('нормализует пробелы и регистр, но не объединяет синонимы и части названий', () => {
    expect(ids({ ...empty, included: [' СлАдКиЙ \t перец '] })).toEqual(['pepper', 'pasta']);
    expect(ids({ ...empty, included: ['помидоры'] })).toEqual(['pasta']);
    expect(ids({ ...empty, included: ['перец'] })).toEqual([]);
  });

  it('учитывает ингредиенты «по вкусу» без числового количества', () => {
    expect(ids({ ...empty, included: ['соль'] })).toEqual(['tomato']);
  });

  it('сохраняет выбранный продукт в списке после удаления его рецептов', () => {
    expect(getIngredientOptions([], ['Огурец', 'огурец'])).toEqual([{ value: 'огурец', label: 'Огурец' }]);
    expect(filterRecipes([], { search: '', maxMinutes: null, ingredients: empty })).toEqual([]);
  });
});
