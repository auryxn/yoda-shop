import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [texts, setTexts] = useState({});
  useEffect(() => {
    fetch('/api/site-texts').then(r => r.json()).then(d => setTexts(d.texts)).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <Link to="/" className="footer-logo">YODA</Link>
      <div className="footer-links">
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/faq">FAQ</Link>
      </div>
      <p className="footer-text">{texts.footerText || '© 2026 YODA Metal Cases'}</p>
    </footer>
  );
}
