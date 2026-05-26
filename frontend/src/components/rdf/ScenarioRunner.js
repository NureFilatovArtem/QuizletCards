import React, { useEffect, useState } from 'react';

// Shared component used by Interactive Dialogues + Daily Challenge.
// Renders a scenario card with options, scoring, and feedback.
export default function ScenarioRunner({ scenario, onNext, onAttempt, label = 'Scenario' }) {
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setPicked(null); setRevealed(false); }, [scenario?.id]);

  if (!scenario) return null;

  const choose = async (i) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    const correct = i === scenario.correctIndex;
    onAttempt && onAttempt({
      exerciseType: 'scenario',
      exerciseId: scenario.id,
      correct,
      score: scenario.scores[i],
    });
  };

  return (
    <div className="rdf-card">
      <div className="rdf-card-label">{label}</div>
      <div className="rdf-meta">
        <span className="rdf-tag level">{scenario.level}</span>
        <span className="rdf-tag">{scenario.category}</span>
        <span style={{ color: 'var(--rdf-muted)', fontSize: 12 }}>{scenario.setting}</span>
      </div>
      <p className="rdf-prompt">{scenario.prompt}</p>

      <div className="rdf-options">
        {scenario.options.map((opt, i) => {
          let cls = 'rdf-option';
          if (revealed) {
            if (i === scenario.correctIndex) cls += ' correct';
            else if (i === picked) cls += ' wrong';
          } else if (picked === i) cls += ' selected';
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
              {opt}
              {revealed && <span className="score">{scenario.scores[i]}/10</span>}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="rdf-feedback">
          <h4>{picked === scenario.correctIndex ? '✓ Natural choice' : 'Almost — the natural one is highlighted'}</h4>
          <p style={{ margin: '6px 0' }}>{scenario.explanation}</p>
          {scenario.alternatives?.length > 0 && (
            <>
              <strong style={{ fontSize: 13 }}>Native alternatives:</strong>
              <ul>{scenario.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </>
          )}
        </div>
      )}

      <div className="rdf-actions">
        <button className="rdf-btn" onClick={onNext} disabled={!revealed}>Next →</button>
      </div>
    </div>
  );
}
