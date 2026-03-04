import React, { useState, useMemo } from 'react';
import './ImportCards.css';

const FORMATS = [
    { id: 'tab-newline', label: 'Tab / Newline (Quizlet)', termSep: '\t', cardSep: '\n' },
    { id: 'semicolon-newline', label: 'Semicolon / Newline', termSep: ';', cardSep: '\n' },
    { id: 'comma-newline', label: 'Comma / Newline', termSep: ',', cardSep: '\n' },
    { id: 'custom', label: 'Custom', termSep: '', cardSep: '' },
];

function ImportCards({ folders, onImport, onClose }) {
    const [folderMode, setFolderMode] = useState('new'); // 'new' or 'existing'
    const [folderName, setFolderName] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState(folders.length > 0 ? folders[0].id : '');
    const [formatId, setFormatId] = useState('tab-newline');
    const [customTermSep, setCustomTermSep] = useState(';');
    const [customCardSep, setCustomCardSep] = useState('\\n');
    const [rawText, setRawText] = useState('');
    const [importing, setImporting] = useState(false);

    const activeFormat = FORMATS.find(f => f.id === formatId);
    const termSep = formatId === 'custom' ? customTermSep : activeFormat.termSep;
    const cardSep = formatId === 'custom'
        ? customCardSep.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
        : activeFormat.cardSep;

    const parsed = useMemo(() => {
        if (!rawText.trim()) return [];
        const lines = rawText.split(cardSep).filter(l => l.trim());
        return lines.map(line => {
            const parts = line.split(termSep);
            if (parts.length >= 2) {
                return { front: parts[0].trim(), back: parts.slice(1).join(termSep).trim(), valid: true };
            }
            return { front: line.trim(), back: '', valid: false };
        });
    }, [rawText, termSep, cardSep]);

    const validCards = parsed.filter(c => c.valid);
    const invalidCount = parsed.filter(c => !c.valid).length;

    const handleImport = async () => {
        if (validCards.length === 0) return;
        const folder = folderMode === 'new' ? { name: folderName.trim() } : { id: selectedFolderId };
        if (folderMode === 'new' && !folder.name) {
            alert('Please enter a folder name');
            return;
        }
        setImporting(true);
        try {
            await onImport(folder, validCards);
            onClose();
        } catch (err) {
            alert('Import failed: ' + (err.message || 'Unknown error'));
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="import-overlay" onClick={onClose}>
            <div className="import-modal" onClick={e => e.stopPropagation()}>
                <div className="import-header">
                    <h2>Import Cards</h2>
                    <button className="import-close-btn" onClick={onClose}>×</button>
                </div>

                {/* Folder selection */}
                <div className="import-section">
                    <label className="import-label">Folder</label>
                    <div className="folder-mode-toggle">
                        <button
                            className={folderMode === 'new' ? 'active' : ''}
                            onClick={() => setFolderMode('new')}
                        >
                            Create New
                        </button>
                        {folders.length > 0 && (
                            <button
                                className={folderMode === 'existing' ? 'active' : ''}
                                onClick={() => setFolderMode('existing')}
                            >
                                Use Existing
                            </button>
                        )}
                    </div>
                    {folderMode === 'new' ? (
                        <input
                            type="text"
                            className="import-input"
                            placeholder="Enter folder name…"
                            value={folderName}
                            onChange={e => setFolderName(e.target.value)}
                        />
                    ) : (
                        <select
                            className="import-input"
                            value={selectedFolderId}
                            onChange={e => setSelectedFolderId(Number(e.target.value))}
                        >
                            {folders.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.cardCount} cards)</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Format selection */}
                <div className="import-section">
                    <label className="import-label">Format</label>
                    <div className="format-options">
                        {FORMATS.map(f => (
                            <button
                                key={f.id}
                                className={`format-btn ${formatId === f.id ? 'active' : ''}`}
                                onClick={() => setFormatId(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    {formatId === 'custom' && (
                        <div className="custom-sep-row">
                            <div>
                                <label>Between term & definition:</label>
                                <input
                                    type="text"
                                    value={customTermSep}
                                    onChange={e => setCustomTermSep(e.target.value)}
                                    className="import-input small"
                                />
                            </div>
                            <div>
                                <label>Between cards:</label>
                                <input
                                    type="text"
                                    value={customCardSep}
                                    onChange={e => setCustomCardSep(e.target.value)}
                                    className="import-input small"
                                    placeholder="Use \n for newline"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Text area */}
                <div className="import-section">
                    <label className="import-label">Paste your cards</label>
                    <textarea
                        className="import-textarea"
                        rows="8"
                        placeholder={`Paste text here…\nExample: term${termSep === '\t' ? '  [TAB]  ' : termSep}definition`}
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                    />
                </div>

                {/* Preview */}
                {parsed.length > 0 && (
                    <div className="import-section">
                        <label className="import-label">
                            Preview — {validCards.length} card{validCards.length !== 1 ? 's' : ''} found
                            {invalidCount > 0 && <span className="invalid-badge"> ({invalidCount} invalid)</span>}
                        </label>
                        <div className="preview-list">
                            {parsed.map((card, i) => (
                                <div key={i} className={`preview-card ${card.valid ? '' : 'invalid'}`}>
                                    <span className="preview-front">{card.front || '—'}</span>
                                    <span className="preview-arrow">→</span>
                                    <span className="preview-back">{card.back || '(missing)'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="import-actions">
                    <button className="import-cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="import-submit-btn"
                        onClick={handleImport}
                        disabled={validCards.length === 0 || importing}
                    >
                        {importing ? 'Importing…' : `Import ${validCards.length} Card${validCards.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImportCards;
