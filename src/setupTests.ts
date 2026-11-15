import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom не реализует модальность dialog. Здесь моделируем только открытие и
// закрытие; нативное удержание фокуса и Escape проверяются в браузере.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () { this.open = false; };
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
