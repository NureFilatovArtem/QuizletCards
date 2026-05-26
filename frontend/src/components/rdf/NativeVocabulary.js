import React, { useEffect, useMemo, useState } from 'react';
import { rdfApi } from '../../utils/rdfApi';

const FILTERS = ['all', 'flemish', 'slang', 'general'];

export default function NativeVocabulary({ onBack }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => { rdfApi.vocabulary().then(setItems).catch(() => setItems([])); }, []);

  const visible = useMemo(() => {
    const lc = q.trim().toLowerCase();
    return items.filter((v) => {
      if (filter !== 'all' && v.kind !== filter) return false;
      if (!lc) return true;
      return v.word.toLowerCase().includes(lc) || v.meaning.toLowerCase().includes(lc);
    });
  }, [items, filter, q]);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'nl-BE'; u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>Native Vocabulary</h2>
        <button className="rdf-back" onClick={onBack}>← Back</button>
      </div>

      <div className="rdf-card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="rdf-fast-input" style={{ flex: 1, minWidth: 200 }}
               placeholder="Search word or meaning…" value={q} onChange={(e) => setQ(e.target.value)} />
        {FILTERS.map((f) => (
          <button key={f} className={`rdf-tag ${filter === f ? 'flemish' : ''}`}
                  style={{ cursor: 'pointer', border: 0 }} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="rdf-vocab-list">
        {visible.map((v) => (
          <div key={v.id} className="rdf-vocab-item">
            <div className="rdf-vocab-head">
              <div className="rdf-vocab-word">
                {v.word}
                <button className="rdf-tag" style={{ marginLeft: 8, border: 0, cursor: 'pointer' }} onClick={() => speak(v.word)}>🔊</button>
              </div>
              <div>
                <span className="rdf-tag level">{v.level}</span>
                <span className={`rdf-tag ${v.kind === 'flemish' ? 'flemish' : v.kind === 'slang' ? 'slang' : ''}`} style={{ marginLeft: 6 }}>{v.kind}</span>
              </div>
            </div>
            <div className="rdf-vocab-meaning">{v.meaning}</div>
            <div className="rdf-vocab-example">"{v.example}"</div>
            <div style={{ fontSize: 12, color: 'var(--rdf-muted)', marginTop: 4 }}>{v.context}</div>
          </div>
        ))}
        {visible.length === 0 && <div className="rdf-card">No matches.</div>}
      </div>
    </div>
  );
}
