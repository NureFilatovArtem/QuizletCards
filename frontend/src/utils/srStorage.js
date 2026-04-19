const KEY = (folderId) => `qsr_${folderId}`;

export function getSRData(folderId) {
  try {
    return JSON.parse(localStorage.getItem(KEY(folderId))) || {};
  } catch {
    return {};
  }
}

// results: [{ cardId, correct: bool }]
export function updateSRData(folderId, results) {
  const data = getSRData(folderId);
  results.forEach(({ cardId, correct }) => {
    if (!data[cardId]) data[cardId] = { wrong: 0, correct: 0 };
    if (correct) data[cardId].correct++;
    else data[cardId].wrong++;
  });
  localStorage.setItem(KEY(folderId), JSON.stringify(data));
}

export function getHardCards(folderId, allCards) {
  const data = getSRData(folderId);
  return allCards
    .filter(c => data[c.id]?.wrong > 0)
    .sort((a, b) => {
      const da = data[a.id], db = data[b.id];
      const ra = da.wrong / (da.wrong + da.correct);
      const rb = db.wrong / (db.wrong + db.correct);
      return rb - ra;
    });
}

export function getCardDifficulty(folderId, cardId) {
  const data = getSRData(folderId);
  return data[cardId] || null;
}
