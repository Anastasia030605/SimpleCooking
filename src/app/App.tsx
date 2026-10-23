import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { CatalogPage } from '../pages/CatalogPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { RecipePage } from '../pages/RecipePage';
import { NewRecipePlaceholder } from '../pages/RoutePlaceholders';

const navigation = [
  { to: '/recipes', label: 'Каталог', end: true },
  { to: '/favorites', label: 'Избранное', end: false },
  { to: '/recipes/new', label: 'Создать рецепт', end: false },
];

export function App() {
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
      <main id="main-content" className="container main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<CatalogPage />} />
          <Route path="/recipes/new" element={<NewRecipePlaceholder />} />
          <Route path="/recipes/:id" element={<RecipePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </main>
    </>
  );
}
