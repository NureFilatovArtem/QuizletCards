import React, { useState, useEffect } from 'react';
import './App.css';
import FolderList from './components/FolderList';
import FolderView from './components/FolderView';
import TestMode from './components/TestMode';
import ImportCards from './components/ImportCards';

const API_URL = 'http://localhost:3001/api';

function App() {
  // Navigation: 'folders' | 'folder' | 'test'
  const [view, setView] = useState('folders');
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [folderCards, setFolderCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  // ─── API helpers ───

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API_URL}/folders`);
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderCards = async (folderId) => {
    try {
      const res = await fetch(`${API_URL}/folders/${folderId}/cards`);
      const data = await res.json();
      setFolderCards(data);
    } catch (err) {
      console.error('Error fetching folder cards:', err);
    }
  };

  // ─── Navigation ───

  const handleSelectFolder = async (folderId) => {
    setSelectedFolderId(folderId);
    await fetchFolderCards(folderId);
    setView('folder');
  };

  const handleBackToFolders = () => {
    setView('folders');
    setSelectedFolderId(null);
    setFolderCards([]);
    fetchFolders(); // refresh counts
  };

  const handleStartTest = () => {
    setView('test');
  };

  const handleBackFromTest = () => {
    setView('folder');
  };

  // ─── Card actions ───

  const handleAddCardToFolder = async (front, back) => {
    try {
      const res = await fetch(`${API_URL}/folders/${selectedFolderId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front, back }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Failed to add card: ' + (err.error || 'Unknown error'));
        return false;
      }
      const newCard = await res.json();
      setFolderCards(prev => [newCard, ...prev]);
      return true;
    } catch (err) {
      alert('Failed to add card: ' + err.message);
      return false;
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await fetch(`${API_URL}/cards/${id}`, { method: 'DELETE' });
      setFolderCards(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  const handleDeleteFolder = async () => {
    if (!window.confirm('Delete this folder and all its cards?')) return;
    try {
      await fetch(`${API_URL}/folders/${selectedFolderId}`, { method: 'DELETE' });
      handleBackToFolders();
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  // ─── Import ───

  const handleImport = async (folder, cards) => {
    let folderId = folder.id;

    // Create folder if new
    if (!folderId) {
      const res = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folder.name }),
      });
      if (!res.ok) throw new Error('Failed to create folder');
      const created = await res.json();
      folderId = created.id;
    }

    // Bulk import cards
    const res = await fetch(`${API_URL}/folders/${folderId}/cards/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards }),
    });
    if (!res.ok) throw new Error('Failed to import cards');

    // Refresh and navigate to the folder
    await fetchFolders();
    await handleSelectFolder(folderId);
  };

  // ─── Render ───

  if (loading) {
    return <div className="app"><div className="loading">Loading…</div></div>;
  }

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Quizlet Prototype</h1>
      </header>

      {view === 'folders' && (
        <FolderList
          folders={folders}
          onSelectFolder={handleSelectFolder}
          onOpenImport={() => setShowImport(true)}
        />
      )}

      {view === 'folder' && selectedFolder && (
        <FolderView
          folder={selectedFolder}
          cards={folderCards}
          onBack={handleBackToFolders}
          onDeleteCard={handleDeleteCard}
          onAddCard={handleAddCardToFolder}
          onOpenImport={() => setShowImport(true)}
          onStartTest={handleStartTest}
          onDeleteFolder={handleDeleteFolder}
        />
      )}

      {view === 'test' && selectedFolder && (
        <TestMode
          cards={folderCards}
          folderName={selectedFolder.name}
          onBack={handleBackFromTest}
        />
      )}

      {showImport && (
        <ImportCards
          folders={folders}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

export default App;
