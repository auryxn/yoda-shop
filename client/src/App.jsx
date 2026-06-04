import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import { useCart } from './context/CartContext';

function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '32px', right: '32px', zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px', padding: '14px 24px',
      fontFamily: "'Press Start 2P', monospace", fontSize: '9px',
      color: '#ffcc00', maxWidth: '300px',
      animation: 'toastIn 0.3s ease',
    }}>
      {toast.message}
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <Toast />
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<div className="app"><Home /></div>} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        </Routes>
      </PageTransition>
    </>
  );
}
