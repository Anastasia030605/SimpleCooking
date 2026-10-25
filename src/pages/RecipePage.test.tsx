import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useParams } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { FAVORITES_STORAGE_KEY } from '../data/favoriteStore';
import { RECIPES_STORAGE_KEY } from '../data/recipeStore';
import type { Recipe } from '../domain/recipe';
import { RecipePage } from './RecipePage';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useParams: vi.fn() };
});

const recipe: Recipe = {
  id: 'test-pasta',
  title: 'Паста для теста',
  category: 'Основные блюда',
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  baseServings: 2,
  ingredients: [{ id: 'pasta', name: 'Макароны', amount: 200, unit: 'г' }],
  steps: [{ id: 'boil', text: 'Отварите макароны до готовности.' }],
  authorId: 'test-user',
  createdAt: '2026-10-24T12:00:00.000Z',
};

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify([recipe]));
  vi.mocked(useParams).mockReturnValue({ id: recipe.id });
});

test('открывает рецепт, пересчитывает ингредиенты и добавляет рецепт в избранное', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter
      initialEntries={[`/recipes/${recipe.id}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RecipePage />
    </MemoryRouter>,
  );

  expect(await screen.findByRole('heading', { level: 1, name: recipe.title })).toBeInTheDocument();
  const ingredients = within(screen.getByRole('region', { name: 'Ингредиенты' }));
  expect(ingredients.getByText('Порций: 2')).toBeInTheDocument();
  expect(ingredients.getByText('200 г')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Увеличить порции' }));

  expect(ingredients.getByText('Порций: 3')).toBeInTheDocument();
  expect(ingredients.getByText('300 г')).toBeInTheDocument();
  expect(ingredients.queryByText('200 г')).not.toBeInTheDocument();
  expect(window.localStorage.getItem(RECIPES_STORAGE_KEY)).toBe(JSON.stringify([recipe]));

  await user.click(screen.getByRole('button', { name: 'Добавить в избранное' }));

  expect(await screen.findByRole('button', { name: 'Удалить из избранного' }))
    .toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('button', { name: 'Добавить в избранное' })).not.toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]')).toEqual([recipe.id]);
});
