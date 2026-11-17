import { useId } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { normalizeIngredientName } from './recipe-filters';
import type { IngredientFilters, IngredientOption } from './recipe-filters';

interface IngredientPickerProps {
  options: IngredientOption[];
  filters: IngredientFilters;
  search: string;
  onSearchChange: (value: string) => void;
  onModeChange: (mode: IngredientFilters['mode']) => void;
  onToggle: (group: 'included' | 'excluded', value: string) => void;
}

export function IngredientPicker({ options, filters, search, onSearchChange, onModeChange, onToggle }: IngredientPickerProps) {
  const hintId = useId();
  const searchId = useId();
  const selectedId = useId();
  const query = normalizeIngredientName(search);
  const visibleOptions = options.filter((option) => option.value.includes(query));
  const selectedGroups = ([
    { key: 'included', label: 'Содержит' },
    { key: 'excluded', label: 'Не содержит' },
  ] as const).map((group) => ({
    ...group,
    options: options.filter(({ value }) => filters[group.key].includes(value)),
  })).filter((group) => group.options.length > 0);

  return (
    <fieldset className="ingredient-filter">
      <legend className="ingredient-filter__legend">Ингредиенты</legend>
      {selectedGroups.map((group) => (
        <div key={group.key} className="ingredient-filter__selected" role="group" aria-labelledby={`${selectedId}-${group.key}`}>
          <p className="ingredient-filter__selected-title" id={`${selectedId}-${group.key}`}>{group.label}</p>
          {group.key === 'included' && (
            <fieldset className="ingredient-filter__mode">
              <legend className="visually-hidden">Режим для условия «Содержит»</legend>
              <label className="ingredient-filter__option">
                <input type="radio" name="ingredient-mode" value="all" checked={filters.mode === 'all'} onChange={() => onModeChange('all')} />
                <span>Все выбранные</span>
              </label>
              <label className="ingredient-filter__option">
                <input type="radio" name="ingredient-mode" value="any" checked={filters.mode === 'any'} onChange={() => onModeChange('any')} />
                <span>Хотя бы один</span>
              </label>
            </fieldset>
          )}
          <ul className="ingredient-filter__chips">
            {group.options.map(({ value, label }) => (
              <li key={value}>
                <Button type="button" variant="secondary" className="ingredient-filter__chip"
                  aria-label={`Снять условие «${group.label}»: ${label}`}
                  onClick={() => { onToggle(group.key, value); document.getElementById(searchId)?.focus(); }}>
                  <span>{label}</span><span aria-hidden="true">×</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Input id={searchId} label="Найти ингредиент" type="search" placeholder="Например, огурец"
        value={search} onChange={(event) => onSearchChange(event.target.value)} />
      {search !== '' && (
        <Button type="button" variant="secondary" onClick={() => { onSearchChange(''); document.getElementById(searchId)?.focus(); }}>
          Очистить поиск ингредиентов
        </Button>
      )}
      <p className="ingredient-filter__hint" id={hintId}>Повторное нажатие снимает выбор.</p>
      <p className="ingredient-filter__hint" role="status">Продуктов найдено: {visibleOptions.length}</p>
      {options.length === 0 ? <p className="ingredient-filter__hint">В каталоге пока нет ингредиентов.</p> : visibleOptions.length === 0 ? (
        <p className="ingredient-filter__hint">Ингредиенты не найдены. Измените или очистите поиск.</p>
      ) : (
        <ul className="ingredient-filter__list" aria-label="Продукты">
          {visibleOptions.map(({ value, label }) => (
            <li key={value} className="ingredient-filter__item">
              <span className="ingredient-filter__name">{label}</span>
              <div className="ingredient-filter__actions" role="group" aria-label={label} aria-describedby={hintId}>
                <Button type="button" variant={filters.included.includes(value) ? 'primary' : 'secondary'}
                  aria-label={`Содержит: ${label}`}
                  aria-pressed={filters.included.includes(value)} onClick={() => onToggle('included', value)}>
                  Содержит
                </Button>
                <Button type="button" variant={filters.excluded.includes(value) ? 'primary' : 'secondary'}
                  aria-label={`Не содержит: ${label}`}
                  aria-pressed={filters.excluded.includes(value)} onClick={() => onToggle('excluded', value)}>
                  Не содержит
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
