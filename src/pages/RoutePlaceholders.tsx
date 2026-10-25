import { Link, useParams } from 'react-router-dom';
import { useRecipes } from '../data/useRecipes';
import { formatMinutes, getTotalTimeMinutes } from '../domain/recipe';

/** Участник 2 заменит этот маршрут полноценной страницей рецепта. */
export function RecipePlaceholder() {
  const { id } = useParams<{ id: string }>();
  const { status, recipes, error } = useRecipes();
  const recipe = recipes.find((item) => item.id === id);

  if (status === 'loading') return <p role="status">Загружаем рецепт…</p>;
  if (status === 'error') return <p role="alert">{error}</p>;

  return (
    <section className="placeholder-page">
      <Link className="back-link" to="/recipes">← Вернуться в каталог</Link>
      {recipe ? (
        <>
          <p className="eyebrow">{recipe.category}</p>
          <h1>{recipe.title}</h1>
          {recipe.description && <p>{recipe.description}</p>}
          <p>{formatMinutes(getTotalTimeMinutes(recipe))} · {recipe.baseServings} порц.</p>
          <p className="placeholder-note">Маршрут готов. Ингредиенты, изменение порций и избранное добавляет участник 2.</p>
        </>
      ) : (
        <>
          <h1>Рецепт не найден</h1>
          <p>Возможно, рецепт больше не доступен.</p>
        </>
      )}
    </section>
  );
}

/** Участник 3 заменит этот маршрут формой публикации. */
export function NewRecipePlaceholder() {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">Новый рецепт</p>
      <h1>Поделитесь своим рецептом</h1>
      <p>Маршрут готов. Форму публикации добавляет участник 3.</p>
      <Link className="back-link" to="/recipes">← Вернуться в каталог</Link>
    </section>
  );
}

/** Участник 2 заменит этот маршрут экраном избранного. */
export function FavoritesPlaceholder() {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">Избранное</p>
      <h1>Сохранённые рецепты</h1>
      <p>Маршрут готов. Список избранного добавляет участник 2.</p>
      <Link className="back-link" to="/recipes">← Вернуться в каталог</Link>
    </section>
  );
}
