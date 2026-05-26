import React, { useEffect, useState } from 'react';
import './rdf.css';
import { rdfApi } from '../../utils/rdfApi';
import InteractiveDialogues from './InteractiveDialogues';
import HiddenMeaning from './HiddenMeaning';
import FastResponse from './FastResponse';
import SentenceBuilder from './SentenceBuilder';
import SpeechDecoder from './SpeechDecoder';
import NativeVocabulary from './NativeVocabulary';
import DailyChallenge from './DailyChallenge';

const TILES = [
  { id: 'dialogues',  emoji: '💬', title: 'Interactive Dialogues', desc: 'Pick the natural Flemish response.' },
  { id: 'hidden',     emoji: '🕵️', title: 'Hidden Meaning',         desc: 'What do they actually mean?' },
  { id: 'fast',       emoji: '⚡', title: 'Fast Response',          desc: 'Beat the clock — answer instantly.' },
  { id: 'builder',    emoji: '🧱', title: 'Sentence Builder',       desc: 'Build sentences that sound native.' },
  { id: 'decoder',    emoji: '🎧', title: 'Speech Decoder',         desc: 'Textbook vs. real Flemish.' },
  { id: 'vocab',      emoji: '📚', title: 'Native Vocabulary',      desc: 'Slang, expressions, hidden nuance.' },
  { id: 'daily',      emoji: '🔥', title: 'Daily Challenge',        desc: 'One scenario per day. Keep the streak.' },
];

export default function RealDutchFluency({ onBack }) {
  const [view, setView] = useState('hub');
  const [progress, setProgress] = useState(null);

  const refresh = () => rdfApi.progress().then(setProgress).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const onAttempt = (body) => rdfApi.attempt(body).then((r) => { setProgress(r.progress); return r; });

  if (view !== 'hub') {
    const back = () => { setView('hub'); refresh(); };
    if (view === 'dialogues') return <InteractiveDialogues onBack={back} onAttempt={onAttempt} />;
    if (view === 'hidden')    return <HiddenMeaning       onBack={back} onAttempt={onAttempt} />;
    if (view === 'fast')      return <FastResponse        onBack={back} onAttempt={onAttempt} />;
    if (view === 'builder')   return <SentenceBuilder     onBack={back} onAttempt={onAttempt} />;
    if (view === 'decoder')   return <SpeechDecoder       onBack={back} />;
    if (view === 'vocab')     return <NativeVocabulary    onBack={back} />;
    if (view === 'daily')     return <DailyChallenge      onBack={back} onAttempt={onAttempt} />;
  }

  return (
    <div className="rdf">
      <div className="rdf-header">
        <h2>Real Dutch Fluency <span style={{ fontSize: 14, color: 'var(--rdf-muted)', marginLeft: 8 }}>Flemish · B1 → C1</span></h2>
        <button className="rdf-back" onClick={onBack}>← Dashboard</button>
      </div>

      <div className="rdf-stats">
        <Stat label="Fluency"  value={`${progress?.fluencyScore ?? 0}/100`} sub="ramps up with quality answers" />
        <Stat label="XP"       value={progress?.xp ?? 0}                    sub={`level ${progress?.level ?? 1}`} />
        <Stat label="Streak"   value={`${progress?.streakDays ?? 0}d`}      sub="answer once a day to keep it" />
        <Stat label="Today"    value={progress?.lastActive === todayStr() ? '✓ active' : '—'} sub="daily challenge waiting" />
      </div>

      <div className="rdf-tiles">
        {TILES.map((t) => (
          <button key={t.id} className="rdf-tile" onClick={() => setView(t.id)}>
            <div className="rdf-tile-emoji">{t.emoji}</div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rdf-stat">
      <div className="rdf-stat-label">{label}</div>
      <div className="rdf-stat-value">{value}</div>
      <div className="rdf-stat-sub">{sub}</div>
    </div>
  );
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
