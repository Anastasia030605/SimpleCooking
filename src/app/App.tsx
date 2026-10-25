import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { CatalogPage } from '../pages/CatalogPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { RecipePage } from '../pages/RecipePage';
import { CreateRecipePage } from '../features/recipes/CreateRecipePage';
import { MyRecipesPage } from '../pages/MyRecipesPage';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DisplaySettings } from '../features/accessibility/DisplaySettings';

const navigation = [
  { to: '/recipes', label: 'Каталог', end: true },
  { to: '/favorites', label: 'Избранное', end: false },
  { to: '/recipes/new', label: 'Создать рецепт', end: false },
  { to: '/profile', label: 'Мои рецепты', end: false },
];

export function App() {
  const { pathname } = useLocation();
  useEffect(() => { document.getElementById('main-content')?.focus(); }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>
      <header className="site-header">
        <div className="site-header__inner container">
          <NavLink className="brand" to="/recipes" aria-label="SimpleCooking — каталог рецептов">
            <span className="brand__mark" aria-hidden="true">♥</span>
            <span className="brand__name">SimpleCooking</span>
          </NavLink>
          <nav aria-label="Основная навигация">
            <ul className="site-nav">
              {navigation.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
                    end={end}
                    to={to}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <DisplaySettings />
      <main id="main-content" className="container main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<CatalogPage />} />
          <Route path="/recipes/new" element={<CreateRecipePage />} />
          <Route path="/recipes/:id" element={<RecipePage />} />
          <Route path="/profile" element={<MyRecipesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </main>
    </>
  );
}
