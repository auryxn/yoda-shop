import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [exploding, setExploding] = useState(false);
  const [banner, setBanner] = useState({ title: 'YODA Metal Cases', subtitle: '', buttonText: 'Start', buttonLink: '/catalog' });

  useEffect(() => {
    fetch('/api/banner').then(r => r.json()).then(d => setBanner(d.banner)).catch(() => {});
  }, []);

  const handleStart = () => {
    setExploding(true);
    setTimeout(() => navigate(banner.buttonLink || '/catalog'), 700);
  };

  return (
    <div className={`home-content${exploding ? ' home-explode' : ''}`}>
      <h1>{banner.title}</h1>
      {banner.subtitle && <p className="xp-text" style={{ fontSize: '10px', marginBottom: '20px', color: 'rgba(255,255,255,0.6)' }}>{banner.subtitle}</p>}
      <button className="start-btn" onClick={handleStart}>{banner.buttonText}</button>
    </div>
  );
}
