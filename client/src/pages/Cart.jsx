import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, removeFromCart, clearCart, total } = useCart();

  if (cart.length === 0) {
    return (
      <div className="xp-page">
        <div className="xp-panel">
          <h2 className="xp-title">Cart</h2>
          <p className="xp-text">Your cart is empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="xp-page">
      <div className="xp-panel" style={{ maxWidth: '600px', textAlign: 'left' }}>
        <h2 className="xp-title" style={{ textAlign: 'center' }}>Cart</h2>
        {cart.map((item) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontSize: '9px'
          }}>
            <span>{item.name} × {item.qty}</span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: '#39b54a' }}>${(item.price * item.qty).toFixed(2)}</span>
              <button
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: 'none', border: '1px solid rgba(255,100,100,0.4)', color: '#ff6b6b',
                  padding: '4px 8px', cursor: 'pointer', fontFamily: 'Press Start 2P', fontSize: '7px'
                }}
              >✕</button>
            </div>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: '16px',
          fontSize: '11px', color: '#ffcc00'
        }}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <Link to="/checkout" className="start-btn" style={{
          marginTop: '20px', fontSize: '10px', padding: '12px 20px',
          width: '100%', textAlign: 'center', textDecoration: 'none',
          display: 'block'
        }}>
          Checkout
        </Link>
        <button onClick={clearCart} style={{
          marginTop: '10px', background: 'none', border: '1px solid rgba(255,100,100,0.3)',
          color: '#ff6b6b', padding: '8px 16px', width: '100%', cursor: 'pointer',
          fontFamily: 'Press Start 2P', fontSize: '8px', letterSpacing: '1px'
        }}>
          Clear Cart
        </button>
      </div>
    </div>
  );
}
