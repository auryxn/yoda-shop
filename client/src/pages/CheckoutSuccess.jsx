import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      fetch('/api/checkout/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(r => r.json())
        .then(data => setStatus(data.ok ? 'success' : 'error'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('success');
    }
  }, [searchParams]);

  return (
    <div className="xp-page">
      <div className="xp-panel" style={{ textAlign: 'center' }}>
        {status === 'verifying' ? (
          <>
            <h2 className="xp-title">Verifying Payment...</h2>
            <p className="xp-text">Please wait a moment.</p>
          </>
        ) : (
          <>
            <h2 className="xp-title" style={{ color: '#39b54a' }}>🎉 Payment Successful!</h2>
            <p className="xp-text">Your order has been placed. Thank you!</p>
            <button className="start-btn" style={{ marginTop: '20px', fontSize: '12px', padding: '12px 28px' }}
              onClick={() => navigate('/')}>Back Home</button>
          </>
        )}
      </div>
    </div>
  );
}
