import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">YODA</Link>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/catalog">Catalog</Link>
        <Link to="/cart">Cart</Link>
      </nav>
    </header>
  );
}
