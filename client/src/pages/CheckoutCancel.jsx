import { useNavigate } from 'react-router-dom';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="xp-page">
      <div className="xp-panel" style={{ textAlign: 'center' }}>
        <h2 className="xp-title" style={{ color: '#ff6b6b' }}>Payment Cancelled</h2>
        <p className="xp-text">Your payment was not completed. You can try again.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
          <button className="start-btn" style={{ fontSize: '10px', padding: '12px 20px' }}
            onClick={() => navigate('/checkout')}>Try Again</button>
          <button className="start-btn" style={{ fontSize: '10px', padding: '12px 20px', background: '#333', boxShadow: 'none' }}
            onClick={() => navigate('/cart')}>Back to Cart</button>
        </div>
      </div>
    </div>
  );
}
