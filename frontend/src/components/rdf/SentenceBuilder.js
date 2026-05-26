import React, { useEffect, useMemo, useState } from 'react';
import { rdfApi } from '../../utils/rdfApi';

export default function SentenceBuilder({ onBack, onAttempt }) {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { rdfApi.sentenceBuilder().then(setItems).catch(() => setItems([])); }, []);
  const cur = items[idx];

  const shuffledTokens = useMemo(() => {
    if (!cur) return [];
    return [...cur.tokens].sort(() => Math.random() - 0.5).map((t, i) => ({ t, i: `${i}-${t}` }));
  }, [cur?.id]);

  useEffect(() => { setPlaced([]); setRevealed(false); }, [cur?.id]);

  if (!cur) return (
    <div className="rdf"><div className="rdf-header"><h2>Sentence Builder</h2>
      <button className="rdf-back" onClick={onBack}>← Back</button></div>
      <div className="rdf-card">Loading…</div></div>
  );

  const place = (key, t) => {
    if (revealed) return;
    if (placed.find((p) => p.key === key)) return;
    setPlaced((p) => [...p, { key, t }]);
  };
  const undo = () => setPlaced((p) => p.slice(0, -1));

  const submit = () => {
    setRevealed(true);
    const user = placed.map((p) => p.t);
    const ok = isCorrect(user, cur.correct, cur.alternatives);
    onAttempt && onAttempt({
      exerciseType: 'builder',
      exerciseId: cur.id,
      correct: ok,
      score: ok ? 9 : 3,
    });
  };

  const next = () => setIdx((i) => (i + 1) % items.length);

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>Sentence Builder</h2>
        <button className="rdf-back" onClick={onBack}>← Back</button>
      </div>
      <div className="rdf-card">
        <div className="rdf-card-label">Express in natural Flemish</div>
        <p className="rdf-prompt">"{cur.targetMeaning}"</p>

        <div className="rdf-tokens">
          {placed.length === 0 && <span className="rdf-slot">tap words below to build your sentence</span>}
          {placed.map((p, i) => <span key={i} className="rdf-token">{p.t}</span>)}
        </div>

        <div className="rdf-tokens" style={{ background: '#fff' }}>
          {shuffledTokens.map(({ t, i }) => (
            <button
              key={i}
              className={`rdf-token ${placed.find((p) => p.key === i) ? 'placed' : ''}`}
              disabled={!!placed.find((p) => p.key === i) || revealed}
              onClick={() => place(i, t)}>{t}</button>
          ))}
        </div>

        <div className="rdf-actions">
          <button className="rdf-btn ghost" onClick={undo} disabled={revealed || placed.length === 0}>Undo</button>
          {!revealed
            ? <button className="rdf-btn" onClick={submit} disabled={placed.length < 2}>Check</button>
            : <button className="rdf-btn" onClick={next}>Next →</button>}
        </div>

        {revealed && (
          <div className="rdf-feedback">
            <h4>Natural answer</h4>
            <p style={{ margin: '4px 0' }}>{cur.correct.join(' ')}</p>
            {cur.alternatives.length > 0 && (
              <>
                <strong style={{ fontSize: 13 }}>Also natural:</strong>
                <ul>{cur.alternatives.map((a, i) => <li key={i}>{a.join(' ')}</li>)}</ul>
              </>
            )}
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--rdf-muted)' }}>{cur.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function isCorrect(user, correct, alternatives) {
  const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  if (eq(user, correct)) return true;
  return alternatives.some((alt) => eq(user, alt));
}
