import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { RECIPES_STORAGE_KEY } from '../data/recipeStore';
import { seedRecipes } from '../data/seedRecipes';
import { CatalogPage } from './CatalogPage';

function recipe(id: string, title: string, names: string[], total: number) {
  return { ...seedRecipes[0], id, title, prepTimeMinutes: 5, cookTimeMinutes: total - 5,
    ingredients: names.map((name, index) => ({ id: `${id}-${index}`, name, amount: 1, unit: 'шт.' })) };
}
const recipes = [
  recipe('tomato', 'Салат с томатами', ['Томаты', 'Огурец', 'Соль'], 10),
  recipe('pepper', 'Салат с перцем', ['Огурец', 'Сладкий перец'], 20),
  recipe('pasta', 'Паста с помидорами', ['Помидоры', 'Сладкий перец'], 30),
];
beforeEach(() => { localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes)); });
async function renderCatalog() {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CatalogPage /></MemoryRouter>);
  await screen.findByRole('group', { name: 'Ингредиенты' });
}
function action(product: string | RegExp, condition = 'Содержит') {
  return within(screen.getByRole('group', { name: product })).getByRole('button', { name: new RegExp(`^${condition}:`) });
}
function expectResults(titles: string[]) {
  const results = within(screen.getByRole('region', { name: 'Рецепты' }));
  expect(results.getByText(`Найдено: ${titles.length}`)).toBeInTheDocument();
  expect(results.queryAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['Рецепты', ...titles]);
}
function expectReset() {
  expectResults(recipes.map((item) => item.title));
  expect(screen.getByLabelText('Название блюда')).toHaveValue('');
  expect(screen.getByLabelText('Максимальное время, минут')).toHaveValue(null);
  expect(screen.getByLabelText('Найти ингредиент')).toHaveValue('');
  expect(screen.queryByRole('radio', { name: 'Все выбранные' })).not.toBeInTheDocument();
  expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  expect(screen.queryByRole('group', { name: 'Содержит' })).not.toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'Не содержит' })).not.toBeInTheDocument();
}

describe('Фильтры ингредиентов в каталоге', () => {
  it('переключает «все» / «хотя бы один», исключает продукты и сохраняет полный список', async () => {
    const user = userEvent.setup(); await renderCatalog();
    await user.click(action('Томаты'));
    await user.click(action('Огурец'));
    expectResults(['Салат с томатами']);
    expect(within(screen.getByRole('list', { name: 'Продукты' })).getAllByRole('listitem')).toHaveLength(5);
    await user.click(screen.getByRole('radio', { name: 'Хотя бы один' }));
    expectResults(['Салат с томатами', 'Салат с перцем']);
    await user.click(action('Сладкий перец', 'Не содержит'));
    expectResults(['Салат с томатами']);
    expect(localStorage.getItem(RECIPES_STORAGE_KEY)).toBe(JSON.stringify(recipes));
  });

  it('переключает условие продукта без двойного выбора и снимает его повторным нажатием', async () => {
    const user = userEvent.setup(); await renderCatalog();
    const include = action('Томаты');
    const exclude = action('Томаты', 'Не содержит');
    expect(include).toHaveAttribute('aria-pressed', 'false');
    expect(exclude).toHaveAttribute('aria-pressed', 'false');
    await user.click(include);
    expect(include).toHaveAttribute('aria-pressed', 'true');
    expectResults(['Салат с томатами']);
    await user.click(exclude);
    expect(include).toHaveAttribute('aria-pressed', 'false');
    expect(exclude).toHaveAttribute('aria-pressed', 'true');
    expectResults(['Салат с перцем', 'Паста с помидорами']);
    expect(screen.queryByRole('button', { name: 'Снять условие «Содержит»: Томаты' })).not.toBeInTheDocument();
    await user.click(include);
    expect(exclude).toHaveAttribute('aria-pressed', 'false');
    await user.click(include);
    expectReset();
    await user.click(exclude);
    await user.click(exclude);
    expectReset();
  });

  it('ищет продукты без изменения выдачи и сохраняет выбранные условия вне результатов поиска', async () => {
    const user = userEvent.setup(); await renderCatalog();
    const search = screen.getByLabelText('Найти ингредиент');
    await user.type(search, ' СЛАДКИЙ   пе ');
    expect(action('Сладкий перец')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Томаты' })).not.toBeInTheDocument();
    expectResults(recipes.map((item) => item.title));
    await user.click(action('Сладкий перец'));
    expectResults(['Салат с перцем', 'Паста с помидорами']);
    await user.clear(search);
    await user.type(search, 'том');
    await user.click(action('Томаты', 'Не содержит'));
    await user.clear(search);
    await user.type(search, 'несуществующий продукт');
    expect(screen.getByText('Ингредиенты не найдены. Измените или очистите поиск.')).toBeInTheDocument();
    expectResults(['Салат с перцем', 'Паста с помидорами']);
    expect(screen.getByRole('button', { name: 'Снять условие «Не содержит»: Томаты' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Снять условие «Содержит»: Сладкий перец' }));
    expect(search).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Очистить поиск ингредиентов' }));
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(action('Томаты', 'Не содержит')).toHaveAttribute('aria-pressed', 'true');
    expect(action('Сладкий перец')).toHaveAttribute('aria-pressed', 'false');
  });

  it('совмещает все фильтры и сбрасывает их вместе с поиском из пустой выдачи и панели', async () => {
    const user = userEvent.setup(); await renderCatalog();
    await user.click(action('Сладкий перец'));
    await user.click(action('Томаты', 'Не содержит'));
    await user.click(screen.getByRole('radio', { name: 'Хотя бы один' }));
    await user.type(screen.getByLabelText('Название блюда'), 'салат');
    await user.type(screen.getByLabelText('Максимальное время, минут'), '20');
    await user.type(screen.getByLabelText('Найти ингредиент'), 'огур');
    expectResults(['Салат с перцем']);
    await user.clear(screen.getByLabelText('Максимальное время, минут'));
    await user.type(screen.getByLabelText('Максимальное время, минут'), '19');
    expectResults([]);
    await user.click(screen.getByRole('button', { name: 'Показать все рецепты' }));
    expectReset();
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeDisabled();
    await user.click(action('Соль', 'Не содержит'));
    await user.type(screen.getByLabelText('Найти ингредиент'), 'соль');
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expectReset();
  });

  it('управляется пробелом, Enter и стрелками без потери фокуса', async () => {
    const user = userEvent.setup(); await renderCatalog();
    const button = action('Огурец'); button.focus();
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveFocus();
    expectResults(['Салат с томатами', 'Салат с перцем']);
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard('{Enter}');
    screen.getByRole('radio', { name: 'Все выбранные' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Хотя бы один' })).toBeChecked();
  });

  it('сохраняет проверку неверного времени вместе с выбранными ингредиентами', async () => {
    const user = userEvent.setup(); await renderCatalog();
    await user.click(action('Огурец'));
    await user.type(screen.getByLabelText('Максимальное время, минут'), '0');
    expect(screen.getByLabelText('Максимальное время, минут')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/^Найдено:/)).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Максимальное время, минут'));
    expectResults(['Салат с томатами', 'Салат с перцем']);
  });

  it('обновляет продукты из другой вкладки и позволяет снять исчезнувший продукт', async () => {
    const user = userEvent.setup(); await renderCatalog();
    await user.click(action('Томаты'));
    const changed = [recipes[1], recipe('new', 'Суп с тыквой', ['Тыква'], 15)];
    act(() => {
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(changed));
      window.dispatchEvent(new StorageEvent('storage', { key: RECIPES_STORAGE_KEY }));
    });
    expectResults([]);
    expect(action('Тыква')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Снять условие «Содержит»: томаты/i }));
    expect(screen.getByLabelText('Найти ингредиент')).toHaveFocus();
    expectResults(changed.map((item) => item.title));
    expect(screen.queryByRole('group', { name: /томаты/i })).not.toBeInTheDocument();
  });

  it('показывает пустой список, если в каталоге нет рецептов', async () => {
    localStorage.setItem(RECIPES_STORAGE_KEY, '[]'); await renderCatalog();
    expect(screen.getByText('В каталоге пока нет ингредиентов.')).toBeInTheDocument();
    expectResults([]);
  });

  it('группирует условия по смыслу, размещает режим только в «Содержит» и скрывает пустые группы', async () => {
    const user = userEvent.setup(); await renderCatalog();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(action('Огурец', 'Не содержит'));
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(action('Томаты'));
    const included = screen.getByRole('group', { name: 'Содержит' });
    const excluded = screen.getByRole('group', { name: 'Не содержит' });
    expect(included.compareDocumentPosition(excluded) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(included).getByRole('radio', { name: 'Все выбранные' })).toBeChecked();
    expect(within(excluded).queryByRole('radio')).not.toBeInTheDocument();
    const chip = within(included).getByRole('button', { name: 'Снять условие «Содержит»: Томаты' });
    expect(chip).toHaveTextContent(/^Томаты×$/);
    expect(within(excluded).getByRole('button', { name: 'Снять условие «Не содержит»: Огурец' })).toHaveTextContent(/^Огурец×$/);
    expect(action('Томаты')).toHaveTextContent(/^Содержит$/);
    expect(action('Огурец', 'Не содержит')).toHaveTextContent(/^Не содержит$/);
    await user.click(chip);
    expect(screen.queryByRole('group', { name: 'Содержит' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(excluded).toBeInTheDocument();
    expect(screen.getByLabelText('Найти ингредиент')).toHaveFocus();
  });
});
