import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DISPLAY_SETTINGS_KEY, DisplaySettings } from './DisplaySettings';

it('меняет размер с клавиатуры, сохраняет тему, восстанавливает и сбрасывает настройки', async () => {
  const user = userEvent.setup();
  const view = render(<DisplaySettings />);
  await user.tab(); await user.keyboard('{Enter}');
  await user.tab();
  expect(screen.getByRole('radio', { name: 'Обычный' })).toHaveFocus();
  await user.keyboard('{ArrowRight}');
  expect(document.documentElement).toHaveAttribute('data-text-size', 'large');
  await user.click(screen.getByRole('radio', { name: 'Очень крупный' }));
  await user.click(screen.getByRole('checkbox', { name: 'Высокий контраст' }));
  expect(document.documentElement).toHaveAttribute('data-text-size', 'extraLarge');
  expect(document.documentElement).toHaveAttribute('data-contrast', 'high');
  view.unmount();
  render(<DisplaySettings />);
  expect(document.documentElement).toHaveAttribute('data-text-size', 'extraLarge');
  expect(document.documentElement).toHaveAttribute('data-contrast', 'high');
  await user.click(screen.getByText('Настройки отображения', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Сбросить настройки отображения' }));
  expect(document.documentElement).toHaveAttribute('data-text-size', 'normal');
  expect(document.documentElement).toHaveAttribute('data-contrast', 'normal');
  expect(JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY)!)).toEqual({ textSize: 'normal', highContrast: false });
});

it('применяет выбор даже при ошибке записи и сообщает об этом', async () => {
  const user = userEvent.setup(); render(<DisplaySettings />);
  await user.click(screen.getByText('Настройки отображения', { exact: true }));
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  try {
    await user.click(screen.getByRole('checkbox', { name: 'Высокий контраст' }));
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high');
    expect(screen.getByRole('status')).toHaveTextContent('Сохранение в браузере недоступно');
  } finally { spy.mockRestore(); }
});

it('открывает сайт с обычными настройками при повреждённых данных', () => {
  localStorage.setItem(DISPLAY_SETTINGS_KEY, '{broken');
  render(<DisplaySettings />);
  expect(document.documentElement).toHaveAttribute('data-text-size', 'normal');
  expect(document.documentElement).toHaveAttribute('data-contrast', 'normal');
});
