import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { useFavorites } from '../data/useFavorites';
import { useRecipes } from '../data/useRecipes';
import type { Ingredient, Recipe } from '../domain/recipe';
import { formatMinutes, getTotalTimeMinutes } from '../domain/recipe';

function formatIngredientAmount(ingredient: Ingredient, currentServings: number, baseServings: number): string {
  if (ingredient.amount === null) return ingredient.note ?? 'по вкусу';

  const newAmount = ingredient.amount * currentServings / baseServings;
  const amount = newAmount > 0 && newAmount < 0.1
    ? '< 0.1'
    : String(Math.round(newAmount * 100) / 100);
  return `${amount} ${ingredient.unit}`.trim();
}

function RecipeDetails({ recipe }: { recipe: Recipe }) {
  const [currentServings, setCurrentServings] = useState(recipe.baseServings);
  const [announcement, setAnnouncement] = useState('');
  const favorites = useFavorites();
  const selected = favorites.favoriteIds.includes(recipe.id);

  function changeServings(servings: number): void {
    const nextServings = Math.max(1, servings);
    setCurrentServings(nextServings);
    setAnnouncement(`Порций: ${nextServings}. Количество ингредиентов пересчитано.`);
  }

  function toggleRecipeFavorite(): void {
    const added = favorites.toggle(recipe.id);
    if (added !== null) {
      setAnnouncement(added ? 'Рецепт добавлен в избранное.' : 'Рецепт удалён из избранного.');
    }
  }

  return (
    <article className="recipe-page">
      <Link className="back-link" to="/recipes">← Вернуться в каталог</Link>
      <header className="page-intro recipe-page__intro">
        <p className="eyebrow">{recipe.category}</p>
        <h1>{recipe.title}</h1>
        {recipe.description && <p>{recipe.description}</p>}
      </header>

      {recipe.image && <img className="recipe-page__image" src={recipe.image.url} alt={recipe.image.alt} />}

      <dl className="recipe-page__meta">
        <div><dt>Подготовка</dt><dd>{formatMinutes(recipe.prepTimeMinutes)}</dd></div>
        <div><dt>Приготовление</dt><dd>{formatMinutes(recipe.cookTimeMinutes)}</dd></div>
        <div><dt>Общее время</dt><dd>{formatMinutes(getTotalTimeMinutes(recipe))}</dd></div>
      </dl>

      <div className="recipe-page__actions">
        <Button
          type="button"
          variant={selected ? 'primary' : 'secondary'}
          aria-pressed={selected}
          disabled={favorites.status !== 'ready'}
          onClick={toggleRecipeFavorite}
        >
          {selected ? 'Удалить из избранного' : 'Добавить в избранное'}
        </Button>
        <Link className="back-link" to="/favorites">Открыть избранное</Link>
      </div>
      {favorites.error && (
        <div className="message-panel">
          <p>{favorites.error}</p>
          <Button type="button" variant="secondary" onClick={favorites.retry}>Повторить чтение избранного</Button>
        </div>
      )}

      <div className="recipe-page__content">
        <section className="recipe-page__section" aria-labelledby="ingredients-title">
          <h2 id="ingredients-title">Ингредиенты</h2>
          <div className="recipe-page__servings" role="group" aria-label="Количество порций">
            <Button
              type="button"
              variant="secondary"
              aria-label="Уменьшить порции"
              disabled={currentServings <= 1}
              onClick={() => changeServings(currentServings - 1)}
            >−</Button>
            <span className="recipe-page__servings-count">Порций: {currentServings}</span>
            <Button
              type="button"
              variant="secondary"
              aria-label="Увеличить порции"
              onClick={() => changeServings(currentServings + 1)}
            >+</Button>
          </div>
          <ul className="recipe-page__ingredients">
            {recipe.ingredients.map((ingredient) => (
              <li className="recipe-page__ingredient" key={ingredient.id}>
                <span>
                  {ingredient.name}
                  {ingredient.amount !== null && ingredient.note && (
                    <span className="recipe-page__ingredient-note">{ingredient.note}</span>
                  )}
                </span>
                <span className="recipe-page__amount">
                  {formatIngredientAmount(ingredient, currentServings, recipe.baseServings)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="recipe-page__section" aria-labelledby="steps-title">
          <h2 id="steps-title">Приготовление</h2>
          <ol className="recipe-page__steps">
            {recipe.steps.map((step) => <li className="recipe-page__step" key={step.id}>{step.text}</li>)}
          </ol>
        </section>
      </div>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">{favorites.error ?? announcement}</p>
    </article>
  );
}

export function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const { status, recipes, error, retry } = useRecipes();

  if (status === 'loading') return <p role="status">Загружаем рецепт…</p>;
  if (status === 'error') {
    return (
      <section className="message-panel">
        <h1>Не удалось открыть рецепт</h1>
        <p role="alert">{error}</p>
        <Button type="button" onClick={retry}>Повторить</Button>
      </section>
    );
  }

  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) {
    return (
      <section className="placeholder-page">
        <h1>Рецепт не найден</h1>
        <p>Возможно, рецепт больше не доступен.</p>
        <Link className="back-link" to="/recipes">← Вернуться в каталог</Link>
      </section>
    );
  }

  return <RecipeDetails key={recipe.id} recipe={recipe} />;
}
