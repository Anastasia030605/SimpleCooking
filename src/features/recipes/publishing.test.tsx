import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../app/App';
import { FAVORITES_STORAGE_KEY } from '../../data/favoriteStore';
import { getRecipes, RECIPES_STORAGE_KEY } from '../../data/recipeStore';
import { TEST_USER } from '../../domain/recipe';
import { emptyRecipe, toRecipe, validateRecipe } from './recipe-form';

beforeEach(() => { localStorage.clear(); });
function validValues() {
  return {
    ...emptyRecipe(), title: 'Тестовая овсяная каша', category: 'Завтраки',
    prepTimeMinutes: '5', cookTimeMinutes: '15',
    ingredients: [{ id: 'oats', name: 'Хлопья', amount: '0,5', unit: 'стакана', toTaste: false }],
    steps: [{ id: 'cook', text: 'Варить до готовности.' }],
  };
}
function renderApp(route = '/recipes/new') {
  return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>);
}
async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Название *', { exact: true }), 'Тестовая овсяная каша');
  await user.type(screen.getByLabelText('Категория *'), 'Завтраки');
  await user.clear(screen.getByLabelText('Подготовка, минут *'));
  await user.type(screen.getByLabelText('Подготовка, минут *'), '5');
  await user.type(screen.getByLabelText('Приготовление, минут *'), '15');
  await user.type(screen.getByLabelText('Название ингредиента *'), 'Хлопья');
  await user.type(screen.getByLabelText('Количество *'), '0,5');
  await user.type(screen.getByLabelText('Единица измерения *'), 'стакана');
  await user.type(screen.getByLabelText('Что нужно сделать *'), 'Варить до готовности.');
}

describe('Модель формы', () => {
  it('принимает десятичную запятую, необязательное описание и общий контракт команды', () => {
    const values = validValues();
    expect(validateRecipe(values)).toEqual({});
    const recipe = toRecipe(values);
    expect(recipe.authorId).toBe(TEST_USER.id);
    expect(recipe.ingredients[0].amount).toBe(0.5);
    expect(recipe.prepTimeMinutes + recipe.cookTimeMinutes).toBe(20);
    expect(recipe.description).toBeUndefined();
    expect(recipe.image).toBeUndefined();
  });
  it('проверяет обязательные поля, время, порции и alt фотографии', () => {
    const values = emptyRecipe();
    values.prepTimeMinutes = '0'; values.cookTimeMinutes = '0'; values.baseServings = '1.5';
    values.imageUrl = 'javascript:alert(1)';
    const errors = validateRecipe(values);
    for (const key of ['title', 'category', 'cookTimeMinutes', 'baseServings', 'imageUrl', 'imageAlt']) {
      expect(errors).toHaveProperty(key);
    }
    expect(validateRecipe({ ...validValues(), prepTimeMinutes: '-1' })).toHaveProperty('prepTimeMinutes');
    expect(validateRecipe({ ...validValues(), cookTimeMinutes: '1.5' })).toHaveProperty('cookTimeMinutes');
  });
  it('сохраняет «по вкусу» как null, без числового количества и единицы', () => {
    const values = validValues();
    values.ingredients[0] = { ...values.ingredients[0], name: 'Соль', toTaste: true, amount: '', unit: '' };
    expect(validateRecipe(values)).toEqual({});
    expect(toRecipe(values).ingredients[0]).toMatchObject({ name: 'Соль', amount: null, unit: '', note: 'по вкусу' });
  });
});

describe('Публикация в общем приложении', () => {
  it('проводит полный сценарий от публикации до избранного после повторного открытия', async () => {
    const user = userEvent.setup();
    const view = renderApp();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Опубликовать рецепт' }));
    expect(await screen.findByRole('heading', { name: 'Тестовая овсяная каша', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Рецепт опубликован');
    const recipe = getRecipes().find(r => r.title === 'Тестовая овсяная каша')!;
    expect(recipe.authorId).toBe(TEST_USER.id);
    // Часть 1: поиск опубликованного рецепта в общем каталоге по времени.
    await user.click(screen.getByRole('link', { name: /^Каталог$/ }));
    await user.type(screen.getByLabelText('Название блюда'), 'Тестовая овсяная каша');
    await user.type(screen.getByLabelText('Максимальное время, минут'), '19');
    expect(await screen.findByRole('heading', { name: 'Рецепты не найдены' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Максимальное время, минут'));
    await user.type(screen.getByLabelText('Максимальное время, минут'), '30');
    await user.click(await screen.findByRole('link', { name: /Тестовая овсяная каша/ }));
    // Часть 2: пересчёт не меняет исходное количество в хранилище.
    const ingredients = within(await screen.findByRole('region', { name: 'Ингредиенты' }));
    expect(ingredients.getByText('0.5 стакана')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Увеличить порции' }));
    await user.click(screen.getByRole('button', { name: 'Увеличить порции' }));
    expect(ingredients.getByText('Порций: 4')).toBeInTheDocument();
    expect(ingredients.getByText('1 стакана')).toBeInTheDocument();
    expect(getRecipes().find(r => r.id === recipe.id)?.ingredients[0].amount).toBe(0.5);
    await user.click(screen.getByRole('button', { name: 'Добавить в избранное' }));
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toContain(recipe.id);
    await user.click(screen.getByRole('link', { name: 'Открыть избранное' }));
    expect(await screen.findByRole('link', { name: /Тестовая овсяная каша/ })).toBeInTheDocument();
    // Повторный запуск приложения с тем же localStorage.
    view.unmount();
    renderApp('/favorites');
    await user.click(await screen.findByRole('link', { name: /Тестовая овсяная каша/ }));
    expect(await screen.findByRole('heading', { name: 'Тестовая овсяная каша', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить из избранного' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('link', { name: 'Мои рецепты' }));
    expect(await screen.findByRole('link', { name: /Тестовая овсяная каша/ })).toBeInTheDocument();
  });
  it('фокусирует ошибочное поле при отправке пустой формы', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Опубликовать рецепт' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Название *', { exact: true })).toHaveFocus());
    expect(localStorage.getItem(RECIPES_STORAGE_KEY)).toBeNull();
  });
  it('сохраняет введённые данные при ошибке записи', async () => {
    const user = userEvent.setup(); renderApp(); await fillForm(user);
    const original = localStorage.getItem(RECIPES_STORAGE_KEY);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    try {
      await user.click(screen.getByRole('button', { name: 'Опубликовать рецепт' }));
      expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить рецепт');
      expect(screen.getByLabelText('Название *', { exact: true })).toHaveValue('Тестовая овсяная каша');
      expect(localStorage.getItem(RECIPES_STORAGE_KEY)).toBe(original);
      expect(screen.getByRole('button', { name: 'Опубликовать рецепт' })).toBeEnabled();
    } finally { spy.mockRestore(); }
  });
  it('добавляет и удаляет ингредиенты и шаги с возвратом фокуса', async () => {
    const user = userEvent.setup(); renderApp();
    await user.click(screen.getByRole('button', { name: 'Добавить ингредиент' }));
    expect(screen.getAllByLabelText('Название ингредиента *')).toHaveLength(2);
    await waitFor(() => expect(screen.getAllByLabelText('Название ингредиента *')[1]).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Удалить ингредиент 2' }));
    expect(screen.getAllByLabelText('Название ингредиента *')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    expect(screen.getAllByLabelText('Что нужно сделать *')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Удалить шаг 2' }));
    expect(screen.getAllByLabelText('Что нужно сделать *')).toHaveLength(1);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Добавить шаг' })).toHaveFocus());
  });
  it('профиль отбирает свои рецепты, каталог показывает всех авторов', async () => {
    const own = toRecipe(validValues());
    const other = { ...own, id: 'other-recipe', authorId: 'other-user', title: 'Рецепт другого автора' };
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify([own, other]));
    const user = userEvent.setup(); renderApp('/profile');
    expect(await screen.findByRole('link', { name: /Тестовая овсяная каша/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Рецепт другого автора/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /^Каталог$/ }));
    expect(await screen.findByRole('link', { name: /Рецепт другого автора/ })).toBeInTheDocument();
  });
});
