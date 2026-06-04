import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [codeErr, setCodeErr] = useState('');
  const [applying, setApplying] = useState(false);

  const finalTotal = discount ? total * (1 - discount / 100) : total;

  function applyCode() {
    if (!code.trim()) return;
    setApplying(true);
    setCodeErr('');
    fetch('/api/discounts/check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) setDiscount(data.discount);
        else { setDiscount(null); setCodeErr('Invalid code'); }
        setApplying(false);
      })
      .catch(() => { setDiscount(null); setCodeErr('Server error'); setApplying(false); });
  }

  async function handlePay() {
    setPaying(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
          coupon: discount ? code : null,
          customer: { name: 'YODA Customer', address: '' },
        }),
      });
      const data = await res.json();
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        alert('Payment error: ' + (data.error || 'Unknown error'));
        setPaying(false);
      }
    } catch (err) {
      alert('Payment error. Check server.');
      setPaying(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="xp-page">
        <div className="xp-panel">
          <h2 className="xp-title">Checkout</h2>
          <p className="xp-text">Your cart is empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="xp-page">
      <div className="xp-panel" style={{ maxWidth: '500px', textAlign: 'left' }}>
        <h2 className="xp-title" style={{ textAlign: 'center' }}>Checkout</h2>

        {/* Order summary */}
        <div style={{ fontSize: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>{item.name} × {item.qty}</span>
              <span style={{ color: '#39b54a' }}>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#ffcc00', fontSize: '10px' }}>
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {discount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#39b54a', fontSize: '8px' }}>
              <span>Discount ({discount}%)</span>
              <span>-${(total * discount / 100).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#ffcc00', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Promo code */}
        <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <label style={{ fontSize: '8px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Promo Code</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="xp-input" style={{ flex: 1, fontSize: '9px', padding: '8px 12px' }}
              placeholder="Enter code..." value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && applyCode()} />
            <button className="start-btn" style={{ fontSize: '8px', padding: '8px 14px', whiteSpace: 'nowrap' }}
              onClick={applyCode} disabled={applying}>
              {applying ? '...' : 'Apply'}
            </button>
          </div>
          {codeErr && <p style={{ color: '#ff6b6b', fontSize: '7px', marginTop: '4px' }}>{codeErr}</p>}
          {discount && <p style={{ color: '#39b54a', fontSize: '7px', marginTop: '4px' }}>✅ Code applied! {discount}% off</p>}
        </div>

        {/* Pay button */}
        <button
          className="start-btn"
          style={{ marginTop: '8px', fontSize: '10px', padding: '12px 20px', width: '100%', textAlign: 'center' }}
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? 'Redirecting to payment...' : `Pay $${finalTotal.toFixed(2)} with Card 💳`}
        </button>
      </div>
    </div>
  );
}
