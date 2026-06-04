import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Catalog.css';

export default function Catalog() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products.filter(p => p.status === 'Active')))
      .catch(() => {});
  }, []);

  return (
    <div className="catalog-grid">
      {products.map((p) => (
        <Link key={p.id} to={`/product/${p.id}`} className="product-card">
          <img src="/assets/template.png" alt={p.name} />
          <span className="product-name">{p.name}</span>
        </Link>
      ))}
    </div>
  );
}
