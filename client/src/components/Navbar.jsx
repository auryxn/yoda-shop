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
  const isAdmin = Boolean(localStorage.getItem('yoda_admin_token'));
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <nav className="navbar">
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
      <button className="theme-toggle" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
        {theme === 'dark' ? '🖥️' : '🌙'}
      </button>
    </nav>
  );
}
