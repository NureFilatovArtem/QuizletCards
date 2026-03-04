import React from 'react';
import './FolderList.css';

function FolderList({ folders, onSelectFolder, onOpenImport }) {
    return (
        <div className="folder-list-container">
            <div className="folder-list-header">
                <h2>Your Folders</h2>
                <button className="import-btn" onClick={onOpenImport}>
                    <span className="import-btn-icon">＋</span> Import Cards
                </button>
            </div>

            {folders.length === 0 ? (
                <div className="empty-folders">
                    <div className="empty-icon">📁</div>
                    <p>No folders yet</p>
                    <p className="empty-sub">Click <strong>"Import Cards"</strong> to create your first folder and add cards.</p>
                </div>
            ) : (
                <div className="folder-grid">
                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            className="folder-card"
                            onClick={() => onSelectFolder(folder.id)}
                        >
                            <div className="folder-icon">📂</div>
                            <div className="folder-info">
                                <h3 className="folder-name">{folder.name}</h3>
                                <p className="folder-count">
                                    {folder.cardCount} card{folder.cardCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="folder-arrow">›</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FolderList;
