import { useState, useEffect } from 'react';

export default function About() {
  const [texts, setTexts] = useState({});
  useEffect(() => {
    fetch('/api/site-texts').then(r => r.json()).then(d => setTexts(d.texts)).catch(() => {});
  }, []);

  return (
    <div className="xp-page">
      <div className="xp-panel">
        <h2 className="xp-title">{texts.aboutTitle || 'About YODA'}</h2>
        <p className="xp-text">{texts.aboutText || 'Loading...'}</p>
      </div>
    </div>
  );
}
