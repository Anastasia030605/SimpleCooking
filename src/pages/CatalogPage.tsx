import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { RecipeCard } from '../components/RecipeCard';
import { useRecipes } from '../data/useRecipes';
import { IngredientPicker } from '../features/recipes/IngredientPicker';
import { filterRecipes, getIngredientOptions } from '../features/recipes/recipe-filters';
import type { IngredientFilters } from '../features/recipes/recipe-filters';

const EMPTY_INGREDIENT_FILTERS: IngredientFilters = { included: [], excluded: [], mode: 'all' };

export function CatalogPage() {
  const { status, recipes, error, retry } = useRecipes();
  const [search, setSearch] = useState('');
  const [maxMinutes, setMaxMinutes] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredients, setIngredients] = useState<IngredientFilters>(EMPTY_INGREDIENT_FILTERS);

  const minutes = maxMinutes === '' ? null : Number(maxMinutes);
  const minutesError = maxMinutes !== '' && (!Number.isInteger(minutes) || Number(minutes) < 1)
    ? 'Введите целое число больше нуля.'
    : undefined;

  const ingredientOptions = useMemo(
    () => getIngredientOptions(recipes, [...ingredients.included, ...ingredients.excluded]),
    [recipes, ingredients.included, ingredients.excluded],
  );
  const visibleRecipes = useMemo(
    () => filterRecipes(recipes, { search, maxMinutes: minutes, ingredients }),
    [recipes, search, minutes, ingredients],
  );
  const hasFilters = search !== '' || maxMinutes !== '' || ingredientSearch !== '' || ingredients.included.length > 0
    || ingredients.excluded.length > 0 || ingredients.mode !== 'all';

  function toggleIngredient(group: 'included' | 'excluded', value: string): void {
    setIngredients((current) => {
      const opposite = group === 'included' ? 'excluded' : 'included';
      const selected = current[group];
      return { ...current, [opposite]: current[opposite].filter((name) => name !== value), [group]: selected.includes(value)
        ? selected.filter((name) => name !== value)
        : [...selected, value] };
    });
  }

  function resetFilters(): void {
    setSearch('');
    setMaxMinutes('');
    setIngredientSearch('');
    setIngredients(EMPTY_INGREDIENT_FILTERS);
  }

  return (
    <div className="catalog-page">
      <section className="page-intro" aria-labelledby="catalog-title">
        <p className="eyebrow">Найдите идею</p>
        <h1 id="catalog-title">Что приготовим сегодня?</h1>
        <p>Выбирайте рецепт по названию, ингредиентам и времени, которое есть на готовку.</p>
      </section>

      <div className="catalog-layout">
        <aside className="filter-panel" aria-labelledby="filters-title">
          <h2 id="filters-title">Фильтры</h2>
          <Input
            label="Название блюда"
            name="search"
            type="search"
            placeholder="Например, паста"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Input
            label="Максимальное время, минут"
            name="maxMinutes"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder="Например, 30"
            value={maxMinutes}
            onChange={(event) => setMaxMinutes(event.target.value)}
            error={minutesError}
          />
          <p className="filter-panel__hint">Учитываем подготовку и приготовление.</p>
          {status === 'ready' && (
            <IngredientPicker options={ingredientOptions} filters={ingredients} search={ingredientSearch}
              onSearchChange={setIngredientSearch} onToggle={toggleIngredient}
              onModeChange={(mode) => setIngredients((current) => ({ ...current, mode }))} />
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={resetFilters}
            disabled={!hasFilters}
          >
            Сбросить фильтры
          </Button>
        </aside>

        <section className="catalog-results" aria-labelledby="results-title">
          <div className="catalog-results__heading">
            <h2 id="results-title">Рецепты</h2>
            {status === 'ready' && !minutesError && (
              <p className="result-count" role="status">
                Найдено: {visibleRecipes.length}
              </p>
            )}
          </div>

          {status === 'loading' && <p role="status">Загружаем рецепты…</p>}

          {status === 'error' && (
            <div className="message-panel" role="alert">
              <h3>Не удалось открыть каталог</h3>
              <p>{error}</p>
              <Button type="button" onClick={retry}>Повторить</Button>
            </div>
          )}

          {status === 'ready' && minutesError && (
            <div className="message-panel" role="status">
              <p>Исправьте время приготовления, чтобы увидеть результаты.</p>
            </div>
          )}

          {status === 'ready' && !minutesError && visibleRecipes.length === 0 && (
            <div className="message-panel" role="status">
              <h3>Рецепты не найдены</h3>
              <p>Попробуйте изменить название, увеличить время или изменить выбранные ингредиенты.</p>
              <Button type="button" variant="secondary" onClick={resetFilters}>
                Показать все рецепты
              </Button>
            </div>
          )}

          {status === 'ready' && !minutesError && visibleRecipes.length > 0 && (
            <div className="recipe-grid">
              {visibleRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
            </div>
          )}
        </section>
      </div>

      <div className="catalog-footer">
        <p>Есть свой проверенный рецепт?</p>
        <Link className="button button--primary" to="/recipes/new">Добавить рецепт</Link>
      </div>
    </div>
  );
}
