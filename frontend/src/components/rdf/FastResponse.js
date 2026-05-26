import React, { useEffect, useRef, useState } from 'react';
import { rdfApi } from '../../utils/rdfApi';

const TONES = ['casual', 'friendly', 'confident'];

export default function FastResponse({ onBack, onAttempt }) {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [tone, setTone] = useState('casual');
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5000);
  const timerRef = useRef(null);

  useEffect(() => { rdfApi.fastPrompts().then(setItems).catch(() => setItems([])); }, []);
  const cur = items[idx];

  useEffect(() => {
    if (!cur || revealed) return;
    setTimeLeft(cur.timeLimitMs);
    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      const left = cur.timeLimitMs - (Date.now() - t0);
      if (left <= 0) { clearInterval(timerRef.current); reveal(true); }
      else setTimeLeft(left);
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [cur, tone, revealed]);

  const reveal = (timeout = false) => {
    clearInterval(timerRef.current);
    setRevealed(true);
    if (!cur) return;
    const ideal = cur[tone] || '';
    const score = scoreAnswer(answer, ideal, timeout);
    onAttempt && onAttempt({
      exerciseType: 'fast',
      exerciseId: cur.id,
      correct: score >= 6,
      score,
    });
  };

  const next = () => {
    setAnswer(''); setRevealed(false);
    setIdx((i) => (i + 1) % items.length);
  };

  const pct = cur ? Math.max(0, Math.min(100, (timeLeft / cur.timeLimitMs) * 100)) : 0;
  const timerCls = pct < 25 ? 'danger' : pct < 50 ? 'warn' : '';

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>Fast Response</h2>
        <button className="rdf-back" onClick={onBack}>← Back</button>
      </div>

      <div className="rdf-card">
        <div className="rdf-meta">
          {TONES.map((t) => (
            <button key={t}
              className={`rdf-tag ${tone === t ? 'flemish' : ''}`}
              style={{ cursor: 'pointer', border: 0, fontSize: 12 }}
              onClick={() => { if (!revealed) setTone(t); }}>
              {t}
            </button>
          ))}
        </div>

        {!cur ? <div>Loading…</div> : (
          <>
            <p className="rdf-prompt">{cur.prompt}</p>
            <div className="rdf-timer-bar"><div className={`rdf-timer-fill ${timerCls}`} style={{ width: `${pct}%` }} /></div>
            <input
              className="rdf-fast-input"
              placeholder={`Type a ${tone} reply…`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !revealed && reveal()}
              disabled={revealed}
              autoFocus
            />
            {revealed && (
              <div className="rdf-feedback">
                <h4>Ideal {tone} response</h4>
                <p style={{ margin: '4px 0', fontSize: 16 }}>{cur[tone]}</p>
                <p style={{ margin: '4px 0', color: 'var(--rdf-muted)', fontSize: 13 }}>
                  Try saying it aloud 3× before moving on. The goal is muscle memory, not perfection.
                </p>
              </div>
            )}
            <div className="rdf-actions">
              {!revealed
                ? <button className="rdf-btn" onClick={() => reveal()}>Submit</button>
                : <button className="rdf-btn" onClick={next}>Next →</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Simple token-overlap scoring against the ideal reply.
function scoreAnswer(user, ideal, timeout) {
  if (timeout) return 1;
  const norm = (s) => s.toLowerCase().replace(/['",.!?]/g, '').split(/\s+/).filter(Boolean);
  const u = new Set(norm(user));
  const i = norm(ideal);
  if (i.length === 0) return 5;
  const hit = i.filter((w) => u.has(w)).length;
  const ratio = hit / i.length;
  return Math.max(2, Math.round(2 + ratio * 8));
}
