import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_USER } from '../domain/recipe';
import { deleteRecipe, getRecipes, RECIPES_STORAGE_KEY, subscribeToRecipes } from './recipeStore';
import { seedRecipes } from './seedRecipes';

const ownRecipe = { ...seedRecipes[0], id: 'own-recipe', authorId: TEST_USER.id };
const otherRecipe = { ...seedRecipes[1], id: 'other-recipe', authorId: 'other-user' };
const onChange = vi.fn(() => getRecipes());
let unsubscribe: () => void;

beforeEach(() => {
  localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify([ownRecipe, otherRecipe]));
  unsubscribe = subscribeToRecipes(onChange);
});

afterEach(() => {
  unsubscribe();
  vi.restoreAllMocks();
});

describe('Удаление рецепта из локального хранилища', () => {
  it('удаляет свой рецепт, сохраняет чужой и уведомляет подписчиков после записи', () => {
    deleteRecipe(ownRecipe.id, TEST_USER.id);

    expect(getRecipes()).toEqual([otherRecipe]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.results[0].value).toEqual([otherRecipe]);
  });

  it.each([
    [otherRecipe.id, 'Можно удалять только свои рецепты.'],
    ['missing-recipe', 'Рецепт не найден.'],
  ])('не изменяет данные при попытке удалить %s', (id, message) => {
    const write = vi.spyOn(Storage.prototype, 'setItem');

    expect(() => deleteRecipe(id, TEST_USER.id)).toThrow(message);
    expect(write).not.toHaveBeenCalled();
    expect(getRecipes()).toEqual([ownRecipe, otherRecipe]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('сохраняет пустой каталог после удаления всех примеров, не восстанавливая их при чтении', () => {
    localStorage.clear();
    const initialRecipes = getRecipes();
    for (const recipe of initialRecipes) deleteRecipe(recipe.id, TEST_USER.id);

    expect(localStorage.getItem(RECIPES_STORAGE_KEY)).toBe('[]');
    expect(getRecipes()).toEqual([]);
    expect(initialRecipes).toHaveLength(3);
  });

  it('при ошибке записи сохраняет рецепты и не сообщает об успешном изменении', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });

    expect(() => deleteRecipe(ownRecipe.id, TEST_USER.id)).toThrow('quota');
    expect(getRecipes()).toEqual([ownRecipe, otherRecipe]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('не перезаписывает повреждённые данные', () => {
    localStorage.setItem(RECIPES_STORAGE_KEY, '{invalid json');
    const write = vi.spyOn(Storage.prototype, 'setItem');

    expect(() => deleteRecipe(ownRecipe.id, TEST_USER.id)).toThrow();
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(RECIPES_STORAGE_KEY)).toBe('{invalid json');
    expect(onChange).not.toHaveBeenCalled();
  });
});
