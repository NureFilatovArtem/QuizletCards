import React, { useEffect, useState } from 'react';
import { rdfApi } from '../../utils/rdfApi';

export default function SpeechDecoder({ onBack }) {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { rdfApi.speechDecoder().then(setItems).catch(() => setItems([])); }, []);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'nl-BE';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>Speech Decoder</h2>
        <button className="rdf-back" onClick={onBack}>← Back</button>
      </div>

      <div className="rdf-card">
        <p style={{ margin: 0, color: 'var(--rdf-muted)' }}>
          What the textbook says vs. what people actually say in Belgium. Tap a row for pronunciation, contractions, and a regional note. The speaker icon uses your browser's Dutch voice.
        </p>
      </div>

      {items.map((it) => (
        <div key={it.id} className="rdf-card" style={{ padding: 0 }}>
          <div className="rdf-decoder-row" onClick={() => setExpanded(expanded === it.id ? null : it.id)} style={{ cursor: 'pointer' }}>
            <div className="rdf-decoder-textbook">📘 {it.textbook}</div>
            <div className="rdf-decoder-arrow">→</div>
            <div className="rdf-decoder-real">🗣 {it.realFlemish}</div>
          </div>
          {expanded === it.id && (
            <div style={{ padding: '0 14px 14px' }}>
              <div className="rdf-decoder-detail"><strong>Pronunciation:</strong> {it.pronunciation}</div>
              <div className="rdf-decoder-detail"><strong>Contractions:</strong> {it.contractions}</div>
              <div className="rdf-decoder-detail"><strong>Regional note:</strong> {it.regionalNote}</div>
              <div style={{ marginTop: 10 }}>
                <button className="rdf-btn ghost" onClick={() => speak(it.realFlemish)}>🔊 Hear it</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
