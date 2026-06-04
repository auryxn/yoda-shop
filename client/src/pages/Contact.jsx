import { useState, useEffect } from 'react';

export default function Contact() {
  const [texts, setTexts] = useState({});
  useEffect(() => {
    fetch('/api/site-texts').then(r => r.json()).then(d => setTexts(d.texts)).catch(() => {});
  }, []);

  return (
    <div className="xp-page">
      <div className="xp-panel">
        <h2 className="xp-title">{texts.contactTitle || 'Contact Us'}</h2>
        <p className="xp-text">{texts.contactText || 'Loading...'}</p>
      </div>
    </div>
  );
}
