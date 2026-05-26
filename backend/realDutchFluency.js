// Real Dutch Fluency module — schema, seed data, and routes.
// Mounts onto the existing Express app via registerRDF(app, db).

const SEED = require('./rdfSeed');

function registerRDF(app, db) {
  // ─── Schema ──────────────────────────────────────────────────────────
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS rdf_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      level TEXT NOT NULL,
      setting TEXT NOT NULL,
      prompt TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      scores_json TEXT NOT NULL,
      explanation TEXT NOT NULL,
      alternatives_json TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rdf_hidden_meaning (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase TEXT NOT NULL,
      surface_meaning TEXT NOT NULL,
      hidden_meaning TEXT NOT NULL,
      emotional_context TEXT NOT NULL,
      interpretations_json TEXT NOT NULL,
      correct_index INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rdf_fast_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT NOT NULL,
      casual TEXT NOT NULL,
      friendly TEXT NOT NULL,
      confident TEXT NOT NULL,
      time_limit_ms INTEGER NOT NULL DEFAULT 5000
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rdf_sentence_builder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_meaning TEXT NOT NULL,
      tokens_json TEXT NOT NULL,
      correct_json TEXT NOT NULL,
      alternatives_json TEXT NOT NULL,
      explanation TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rdf_speech_decoder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      textbook TEXT NOT NULL,
      real_flemish TEXT NOT NULL,
      pronunciation TEXT NOT NULL,
      contractions TEXT NOT NULL,
      regional_note TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rdf_vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      level TEXT NOT NULL,
      example TEXT NOT NULL,
      context TEXT NOT NULL,
      kind TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rdf_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_key TEXT NOT NULL UNIQUE,
      xp INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_active TEXT,
      fluency_score INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      achievements_json TEXT NOT NULL DEFAULT '[]'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rdf_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_key TEXT NOT NULL,
      exercise_type TEXT NOT NULL,
      exercise_id INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ─── Seed once ─────────────────────────────────────────────────────
    db.get(`SELECT COUNT(*) AS n FROM rdf_scenarios`, (err, row) => {
      if (err || !row || row.n > 0) return;
      seed(db);
    });
  });

  // ─── Routes ──────────────────────────────────────────────────────────
  const list = (table, mapper) => (req, res) => {
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(mapper));
    });
  };

  const parseScenario = r => ({
    id: r.id, category: r.category, level: r.level, setting: r.setting,
    prompt: r.prompt,
    options: JSON.parse(r.options_json),
    correctIndex: r.correct_index,
    scores: JSON.parse(r.scores_json),
    explanation: r.explanation,
    alternatives: JSON.parse(r.alternatives_json),
  });

  const parseHidden = r => ({
    id: r.id, phrase: r.phrase,
    surfaceMeaning: r.surface_meaning,
    hiddenMeaning: r.hidden_meaning,
    emotionalContext: r.emotional_context,
    interpretations: JSON.parse(r.interpretations_json),
    correctIndex: r.correct_index,
  });

  const parseFast = r => ({
    id: r.id, prompt: r.prompt,
    casual: r.casual, friendly: r.friendly, confident: r.confident,
    timeLimitMs: r.time_limit_ms,
  });

  const parseBuilder = r => ({
    id: r.id,
    targetMeaning: r.target_meaning,
    tokens: JSON.parse(r.tokens_json),
    correct: JSON.parse(r.correct_json),
    alternatives: JSON.parse(r.alternatives_json),
    explanation: r.explanation,
  });

  const parseDecoder = r => ({
    id: r.id, textbook: r.textbook, realFlemish: r.real_flemish,
    pronunciation: r.pronunciation, contractions: r.contractions,
    regionalNote: r.regional_note,
  });

  const parseVocab = r => ({
    id: r.id, word: r.word, meaning: r.meaning, level: r.level,
    example: r.example, context: r.context, kind: r.kind,
  });

  app.get('/api/rdf/scenarios', list('rdf_scenarios', parseScenario));
  app.get('/api/rdf/hidden-meaning', list('rdf_hidden_meaning', parseHidden));
  app.get('/api/rdf/fast-prompts', list('rdf_fast_prompts', parseFast));
  app.get('/api/rdf/sentence-builder', list('rdf_sentence_builder', parseBuilder));
  app.get('/api/rdf/speech-decoder', list('rdf_speech_decoder', parseDecoder));
  app.get('/api/rdf/vocabulary', list('rdf_vocabulary', parseVocab));

  // Daily challenge — deterministic by date so it's stable for the day.
  app.get('/api/rdf/daily', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const seed = today.split('-').reduce((a, b) => a + Number(b), 0);
    db.all(`SELECT * FROM rdf_scenarios`, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.json(null);
      const pick = rows[seed % rows.length];
      res.json({ date: today, scenario: parseScenario(pick) });
    });
  });

  // Progress (single-user keyed by 'local' for this prototype).
  app.get('/api/rdf/progress/:key', (req, res) => {
    const key = req.params.key || 'local';
    db.get(`SELECT * FROM rdf_progress WHERE user_key = ?`, [key], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) {
        const init = {
          user_key: key, xp: 0, streak_days: 0, last_active: null,
          fluency_score: 0, level: 1, achievements_json: '[]',
        };
        db.run(
          `INSERT INTO rdf_progress (user_key) VALUES (?)`,
          [key],
          () => res.json(toProgress(init))
        );
        return;
      }
      res.json(toProgress(row));
    });
  });

  // Record an attempt and update XP/streak/fluency.
  app.post('/api/rdf/attempt', (req, res) => {
    const key = req.body.userKey || 'local';
    const { exerciseType, exerciseId, correct, score } = req.body;
    if (!exerciseType || exerciseId == null) {
      return res.status(400).json({ error: 'exerciseType and exerciseId required' });
    }
    const xpGain = correct ? 10 + Math.max(0, score - 6) * 5 : 2;
    db.run(
      `INSERT INTO rdf_attempts (user_key, exercise_type, exercise_id, correct, score) VALUES (?, ?, ?, ?, ?)`,
      [key, exerciseType, exerciseId, correct ? 1 : 0, score || 0]
    );
    db.get(`SELECT * FROM rdf_progress WHERE user_key = ?`, [key], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let xp = (row?.xp || 0) + xpGain;
      let streak = row?.streak_days || 0;
      if (row?.last_active !== today) {
        streak = row?.last_active === yesterday ? streak + 1 : 1;
      }
      const level = Math.max(1, Math.floor(xp / 200) + 1);
      const fluencyDelta = correct ? Math.round((score || 7) / 2) : -1;
      const fluency = Math.max(0, Math.min(100, (row?.fluency_score || 0) + fluencyDelta));
      const insert = !row
        ? `INSERT INTO rdf_progress (user_key, xp, streak_days, last_active, fluency_score, level) VALUES (?, ?, ?, ?, ?, ?)`
        : `UPDATE rdf_progress SET xp=?, streak_days=?, last_active=?, fluency_score=?, level=? WHERE user_key=?`;
      const params = !row
        ? [key, xp, streak, today, fluency, level]
        : [xp, streak, today, fluency, level, key];
      db.run(insert, params, function (e) {
        if (e) return res.status(500).json({ error: e.message });
        db.get(`SELECT * FROM rdf_progress WHERE user_key = ?`, [key], (e2, fresh) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.json({ xpGain, progress: toProgress(fresh) });
        });
      });
    });
  });

  // Placeholder for future AI-generated content.
  app.post('/api/rdf/generate', (req, res) => {
    res.status(501).json({
      error: 'AI generation not configured. Set ANTHROPIC_API_KEY and wire Claude here.',
      requested: req.body,
    });
  });
}

function toProgress(row) {
  return {
    userKey: row.user_key,
    xp: row.xp,
    streakDays: row.streak_days,
    lastActive: row.last_active,
    fluencyScore: row.fluency_score,
    level: row.level,
    achievements: JSON.parse(row.achievements_json || '[]'),
  };
}

function seed(db) {
  const ins = (sql, rows) => {
    const stmt = db.prepare(sql);
    rows.forEach(r => stmt.run(...r));
    stmt.finalize();
  };

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    ins(
      `INSERT INTO rdf_scenarios (category, level, setting, prompt, options_json, correct_index, scores_json, explanation, alternatives_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      SEED.scenarios.map(s => [
        s.category, s.level, s.setting, s.prompt,
        JSON.stringify(s.options), s.correctIndex,
        JSON.stringify(s.scores), s.explanation,
        JSON.stringify(s.alternatives),
      ])
    );

    ins(
      `INSERT INTO rdf_hidden_meaning (phrase, surface_meaning, hidden_meaning, emotional_context, interpretations_json, correct_index) VALUES (?, ?, ?, ?, ?, ?)`,
      SEED.hiddenMeaning.map(h => [
        h.phrase, h.surfaceMeaning, h.hiddenMeaning, h.emotionalContext,
        JSON.stringify(h.interpretations), h.correctIndex,
      ])
    );

    ins(
      `INSERT INTO rdf_fast_prompts (prompt, casual, friendly, confident, time_limit_ms) VALUES (?, ?, ?, ?, ?)`,
      SEED.fastPrompts.map(f => [f.prompt, f.casual, f.friendly, f.confident, f.timeLimitMs || 5000])
    );

    ins(
      `INSERT INTO rdf_sentence_builder (target_meaning, tokens_json, correct_json, alternatives_json, explanation) VALUES (?, ?, ?, ?, ?)`,
      SEED.sentenceBuilder.map(b => [
        b.targetMeaning, JSON.stringify(b.tokens),
        JSON.stringify(b.correct), JSON.stringify(b.alternatives), b.explanation,
      ])
    );

    ins(
      `INSERT INTO rdf_speech_decoder (textbook, real_flemish, pronunciation, contractions, regional_note) VALUES (?, ?, ?, ?, ?)`,
      SEED.speechDecoder.map(d => [d.textbook, d.realFlemish, d.pronunciation, d.contractions, d.regionalNote])
    );

    ins(
      `INSERT INTO rdf_vocabulary (word, meaning, level, example, context, kind) VALUES (?, ?, ?, ?, ?, ?)`,
      SEED.vocabulary.map(v => [v.word, v.meaning, v.level, v.example, v.context, v.kind])
    );

    db.run('COMMIT');
  });
}

module.exports = { registerRDF };
