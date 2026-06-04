import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Product.css';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data.product))
      .catch(() => {});
  }, [id]);

  if (!product) {
    return (
      <div className="product-page">
        <div className="product-loader">Loading...</div>
      </div>
    );
  }

  const images = product.images || [product.image || '/assets/template.png'];

  return (
    <div className="product-page">
      <div className="product-layout">
        {/* Left column — image + gallery */}
        <div className="product-left">
          <div className="product-main-image">
            <img src={images[0]} alt={product.name} />
          </div>
          {images.length > 1 && (
            <div className="product-gallery">
              {images.map((img, i) => (
                <div key={i} className={`gallery-thumb ${i === 0 ? 'active' : ''}`}>
                  <img src={img} alt={`${product.name} view ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
          <button className="back-btn" onClick={() => navigate('/catalog')}>
            ← Back to Catalog
          </button>
        </div>

        {/* Right column — info */}
        <div className="product-right">
          <h2 className="product-title">{product.name}</h2>
          <p className="product-description">{product.description}</p>
          <p className="product-price">${product.price.toFixed(2)}</p>
          <button className="add-to-cart-btn" onClick={() => addToCart(product)}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
}
