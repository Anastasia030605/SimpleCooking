import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { RecipeCard } from '../components/RecipeCard';
import { useRecipes } from '../data/useRecipes';
import { TEST_USER } from '../domain/recipe';

export function MyRecipesPage() {
  const { status, recipes, error, retry } = useRecipes();
  const ownRecipes = recipes.filter(recipe => recipe.authorId === TEST_USER.id);
  return <>
    <header className="page-intro">
      <p className="eyebrow">{TEST_USER.name}</p>
      <h1>Мои рецепты</h1>
      <p>Ваши опубликованные рецепты также доступны в общем каталоге этого браузера.</p>
    </header>
    <p><Link className="button button--primary" to="/recipes/new">Создать рецепт</Link></p>
    {status === 'loading' && <p role="status">Загружаем ваши рецепты…</p>}
    {status === 'error' && <div className="message-panel" role="alert"><p>{error}</p><Button onClick={retry}>Повторить</Button></div>}
    {status === 'ready' && (ownRecipes.length ? (
      <div className="recipe-grid">{ownRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
    ) : <p className="message-panel">Вы ещё не опубликовали ни одного рецепта.</p>)}
  </>;
}
