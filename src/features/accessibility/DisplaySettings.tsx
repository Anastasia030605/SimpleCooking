import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';

export const DISPLAY_SETTINGS_KEY = 'simpleCooking.display.v1';
const sizes = { normal: 'Обычный', large: 'Крупный', extraLarge: 'Очень крупный' } as const;
type TextSize = keyof typeof sizes;
interface Settings { textSize: TextSize; highContrast: boolean }
const defaults: Settings = { textSize: 'normal', highContrast: false };

function readSettings(): Settings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY) ?? 'null');
    if (parsed && typeof parsed === 'object') {
      const value = parsed as Partial<Settings>;
      if (value.textSize && Object.hasOwn(sizes, value.textSize) && typeof value.highContrast === 'boolean') {
        return { textSize: value.textSize, highContrast: value.highContrast };
      }
    }
  } catch { /* Настройки браузера не должны мешать чтению рецептов. */ }
  return defaults;
}

export function DisplaySettings() {
  const [settings, setSettings] = useState(readSettings);
  const [message, setMessage] = useState('');
  useEffect(() => {
    document.documentElement.dataset.textSize = settings.textSize;
    document.documentElement.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    return () => {
      delete document.documentElement.dataset.textSize;
      delete document.documentElement.dataset.contrast;
    };
  }, [settings]);

  function update(next: Settings) {
    setSettings(next);
    try {
      localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(next));
      setMessage('Настройки отображения сохранены.');
    } catch {
      setMessage('Настройки применены. Сохранение в браузере недоступно: после перезагрузки выбор может сброситься.');
    }
  }

  return <details className="display-settings container">
    <summary>Настройки отображения</summary>
    <div className="display-settings__panel">
      <fieldset className="display-settings__sizes">
        <legend>Размер текста</legend>
        {Object.entries(sizes).map(([value, label]) => <label key={value} className="display-settings__option">
          <input type="radio" name="text-size" value={value} checked={settings.textSize === value}
            onChange={() => update({ ...settings, textSize: value as TextSize })} />
          {label}
        </label>)}
      </fieldset>
      <label className="display-settings__option">
        <input type="checkbox" checked={settings.highContrast} onChange={event => update({ ...settings, highContrast: event.target.checked })} />
        Высокий контраст
      </label>
      <Button type="button" variant="secondary" onClick={() => update(defaults)}>Сбросить настройки отображения</Button>
      {message && <p role="status" className="display-settings__status">{message}</p>}
    </div>
  </details>;
}
