import { useState, useEffect } from 'react';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: 'center', color: '#999' }}>Loading...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Catalog</h2>
      <div className="products">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="image">{product.name}</div>
            <div className="info">
              <h3>{product.name}</h3>
              <p className="price">${product.price}</p>
              <a href="#" className="btn">Add to Cart</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
