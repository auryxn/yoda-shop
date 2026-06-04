import { useState, useEffect } from 'react';

export default function Faq() {
  const [texts, setTexts] = useState({});
  useEffect(() => {
    fetch('/api/site-texts').then(r => r.json()).then(d => setTexts(d.texts)).catch(() => {});
  }, []);

  return (
    <div className="xp-page">
      <div className="xp-panel">
        <h2 className="xp-title">{texts.faqTitle || 'FAQ'}</h2>
        <p className="xp-text">{texts.faqText || 'Loading...'}</p>
      </div>
    </div>
  );
}
