import React, { useEffect, useState } from 'react';
import { rdfApi } from '../../utils/rdfApi';

export default function HiddenMeaning({ onBack, onAttempt }) {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);

  useEffect(() => { rdfApi.hiddenMeaning().then(setItems).catch(() => setItems([])); }, []);

  const cur = items[idx];
  const revealed = picked !== null;
  const next = () => { setPicked(null); setIdx((i) => (i + 1) % items.length); };

  const choose = (i) => {
    if (revealed) return;
    setPicked(i);
    onAttempt && onAttempt({
      exerciseType: 'hidden',
      exerciseId: cur.id,
      correct: i === cur.correctIndex,
      score: i === cur.correctIndex ? 9 : 3,
    });
  };

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>What do they actually mean?</h2>
        <button className="rdf-back" onClick={onBack}>← Back</button>
      </div>
      {!cur ? <div className="rdf-card">Loading…</div> : (
        <div className="rdf-card">
          <div className="rdf-card-label">Phrase {idx + 1} / {items.length}</div>
          <p className="rdf-prompt">"{cur.phrase}"</p>
          <div className="rdf-options">
            {cur.interpretations.map((opt, i) => {
              let cls = 'rdf-option';
              if (revealed) {
                if (i === cur.correctIndex) cls += ' correct';
                else if (i === picked) cls += ' wrong';
              }
              return (
                <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
                  {opt}
                </button>
              );
            })}
          </div>
          {revealed && (
            <div className="rdf-feedback">
              <h4>Hidden meaning</h4>
              <p style={{ margin: '4px 0' }}>{cur.hiddenMeaning}</p>
              <p style={{ margin: '4px 0', color: 'var(--rdf-muted)', fontSize: 13 }}>
                <strong>Surface:</strong> {cur.surfaceMeaning}<br />
                <strong>Tone:</strong> {cur.emotionalContext}
              </p>
            </div>
          )}
          <div className="rdf-actions">
            <button className="rdf-btn" onClick={next} disabled={!revealed}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
