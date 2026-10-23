import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { RecipeCard } from '../components/RecipeCard';
import { useFavorites } from '../data/useFavorites';
import { useRecipes } from '../data/useRecipes';

export function FavoritesPage() {
  const recipes = useRecipes();
  const favorites = useFavorites();
  const error = recipes.error ?? favorites.error;
  const ready = recipes.status === 'ready' && favorites.status === 'ready';
  const favoriteRecipes = recipes.recipes.filter((recipe) => favorites.favoriteIds.includes(recipe.id));

  return (
    <div className="favorites-page">
      <header className="page-intro">
        <p className="eyebrow">Избранное</p>
        <h1>Сохранённые рецепты</h1>
        <p>Ваши любимые блюда всегда под рукой.</p>
      </header>

      {!ready && !error && <p role="status">Загружаем избранное…</p>}
      {error && (
        <div className="message-panel">
          <h2>Не удалось открыть избранное</h2>
          <p>{error}</p>
          <Button type="button" onClick={() => { recipes.retry(); favorites.retry(); }}>Повторить</Button>
        </div>
      )}

      {ready && !error && (favoriteRecipes.length > 0 ? (
        <div className="recipe-grid">
          {favoriteRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      ) : (
        <div className="message-panel">
          <h2>В избранном пока нет рецептов</h2>
          <p>Откройте рецепт в каталоге и нажмите «Добавить в избранное».</p>
          <Link className="button button--primary" to="/recipes">Перейти в каталог</Link>
        </div>
      ))}
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {error ?? (ready ? `Рецептов в избранном: ${favoriteRecipes.length}.` : '')}
      </p>
    </div>
  );
}
