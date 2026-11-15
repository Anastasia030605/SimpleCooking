import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../app/App';
import { FAVORITES_STORAGE_KEY } from '../../data/favoriteStore';
import { getRecipes, RECIPES_STORAGE_KEY } from '../../data/recipeStore';
import { seedRecipes } from '../../data/seedRecipes';
import { TEST_USER } from '../../domain/recipe';

const ownRecipe = { ...seedRecipes[0], id: 'recipe-to-delete', title: 'Рецепт для удаления', authorId: TEST_USER.id };
const otherRecipe = { ...seedRecipes[1], id: 'other-recipe', title: 'Рецепт другого автора', authorId: 'other-user' };

function renderApp(route = `/recipes/${ownRecipe.id}`) {
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify([ownRecipe, otherRecipe]));
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([ownRecipe.id, otherRecipe.id]));
});

afterEach(() => { vi.restoreAllMocks(); });

describe('Удаление своего рецепта', () => {
  it('запрашивает подтверждение с клавиатуры и сохраняет данные при отмене', async () => {
    const user = userEvent.setup();
    renderApp();
    const button = await screen.findByRole('button', { name: 'Удалить рецепт' });
    button.focus();

    await user.keyboard('{Enter}');

    const dialog = screen.getByRole('dialog', { name: 'Удалить рецепт?' });
    expect(dialog).toHaveAccessibleDescription(`Рецепт «${ownRecipe.title}» будет удалён. Это действие нельзя отменить.`);
    expect(within(dialog).getByRole('button', { name: 'Отмена' })).toHaveFocus();
    expect(getRecipes()).toEqual([ownRecipe, otherRecipe]);

    await user.keyboard('{Enter}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getRecipes()).toEqual([ownRecipe, otherRecipe]);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual([ownRecipe.id, otherRecipe.id]);
    expect(screen.getByRole('heading', { level: 1, name: ownRecipe.title })).toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('закрывает диалог по событию Escape и возвращает фокус без удаления', async () => {
    const user = userEvent.setup();
    renderApp();
    const button = await screen.findByRole('button', { name: 'Удалить рецепт' });
    await user.click(button);
    // jsdom не генерирует нативное событие cancel по Escape.
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    expect(getRecipes()).toEqual([ownRecipe, otherRecipe]);
  });

  it('после подтверждения удаляет рецепт из всех списков и сохраняет результат при повторном открытии', async () => {
    const user = userEvent.setup();
    const view = renderApp();

    await user.click(await screen.findByRole('button', { name: 'Удалить рецепт' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Мои рецепты' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`Рецепт «${ownRecipe.title}» удалён.`);
    expect(screen.queryByRole('link', { name: /Рецепт для удаления/ })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(getRecipes()).toEqual([otherRecipe]);

    await user.click(screen.getByRole('link', { name: /^Каталог$/ }));
    expect(await screen.findByRole('link', { name: /Рецепт другого автора/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Рецепт для удаления/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /^Избранное$/ }));
    expect(await screen.findByRole('link', { name: /Рецепт другого автора/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Рецепт для удаления/ })).not.toBeInTheDocument();

    view.unmount();
    const reopened = renderApp('/favorites');
    expect(await screen.findByRole('link', { name: /Рецепт другого автора/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Рецепт для удаления/ })).not.toBeInTheDocument();
    reopened.unmount();
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: 'Рецепт не найден' })).toBeInTheDocument();
  });

  it('не предлагает удаление чужого рецепта даже при открытии прямой ссылки', async () => {
    renderApp(`/recipes/${otherRecipe.id}`);

    expect(await screen.findByRole('heading', { level: 1, name: otherRecipe.title })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Удалить рецепт' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getRecipes()).toEqual([ownRecipe, otherRecipe]);
  });

  it('показывает ошибку записи, сохраняет рецепт и позволяет повторить удаление', async () => {
    const user = userEvent.setup();
    renderApp();
    const button = await screen.findByRole('button', { name: 'Удалить рецепт' });
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });

    await user.click(button);
    const dialog = screen.getByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: 'Удалить' });
    await user.click(confirmButton);

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось удалить рецепт');
    expect(screen.getByRole('heading', { level: 1, name: ownRecipe.title })).toBeInTheDocument();
    expect(getRecipes()).toEqual([ownRecipe, otherRecipe]);
    expect(dialog).toBeInTheDocument();
    expect(confirmButton).toBeEnabled();
    write.mockRestore();

    await user.click(confirmButton);

    expect(await screen.findByRole('heading', { level: 1, name: 'Мои рецепты' })).toBeInTheDocument();
    expect(getRecipes()).toEqual([otherRecipe]);
  });

  it('обновляет открытую страницу после удаления рецепта в другой вкладке', async () => {
    const user = userEvent.setup();
    renderApp('/favorites');
    expect(await screen.findByRole('link', { name: /Рецепт для удаления/ })).toBeInTheDocument();
    const oldValue = localStorage.getItem(RECIPES_STORAGE_KEY);
    const newValue = JSON.stringify([otherRecipe]);
    act(() => {
      localStorage.setItem(RECIPES_STORAGE_KEY, newValue);
      window.dispatchEvent(new StorageEvent('storage', { key: RECIPES_STORAGE_KEY, oldValue, newValue, storageArea: localStorage }));
    });

    await waitFor(() => expect(screen.queryByRole('link', { name: /Рецепт для удаления/ })).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Рецепт другого автора/ })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Рецепт другого автора/ }));
    expect(await screen.findByRole('heading', { level: 1, name: otherRecipe.title })).toBeInTheDocument();
  });
});
