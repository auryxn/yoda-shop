import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Catalog' },
  { to: '/cart', label: 'Cart' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { cart } = useCart();
  const { theme, toggle } = useTheme();
  const isAdmin = localStorage.getItem('yoda_admin') === '1';
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <nav className="navbar">
      <div className="navbar-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link${pathname === link.to ? ' active' : ''}`}
          >
            {link.label}
            {link.to === '/cart' && totalQty > 0 && (
              <span className="cart-badge">{totalQty}</span>
            )}
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className={`nav-link admin-link${pathname === '/admin' ? ' active' : ''}`}
          >
            Admin
          </Link>
        )}
      </div>
      <button className="theme-toggle nav-link" onClick={toggle}>
        {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
      </button>
    </nav>
  );
}
