import { Link } from 'react-router-dom';
import type { Recipe } from '../domain/recipe';
import { formatMinutes, getTotalTimeMinutes } from '../domain/recipe';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <Link className="recipe-card__link" to={`/recipes/${encodeURIComponent(recipe.id)}`}>
        <div className="recipe-card__media">
          {recipe.image ? (
            <img className="recipe-card__image" src={recipe.image.url} alt={recipe.image.alt} />
          ) : (
            <span className="recipe-card__illustration" aria-hidden="true">✦</span>
          )}
        </div>
        <div className="recipe-card__body">
          <span className="recipe-card__category">{recipe.category}</span>
          <h2 className="recipe-card__title">{recipe.title}</h2>
          {recipe.description && <p className="recipe-card__description">{recipe.description}</p>}
          <p className="recipe-card__meta">
            <span>{formatMinutes(getTotalTimeMinutes(recipe))}</span>
            <span aria-hidden="true">·</span>
            <span>{recipe.baseServings} порц.</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
