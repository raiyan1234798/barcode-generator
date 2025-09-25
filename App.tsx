
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import BarcodeGenerator from './components/BarcodeGenerator';
import SavedBarcodes from './components/SavedBarcodes';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { BarcodeItem } from './types';
import { BarcodeIcon } from './components/icons/BarcodeIcon';
import { ListIcon } from './components/icons/ListIcon';

type View = 'generator' | 'saved';

const App: React.FC = () => {
  const [view, setView] = useState<View>('generator');
  const [savedItems, setSavedItems] = useLocalStorage<BarcodeItem[]>('arabtimesBarcodes', []);

  const addBarcodeItem = useCallback((item: Omit<BarcodeItem, 'id' | 'timestamp'>) => {
    // Prevent duplicates based on item code
    if (savedItems.some(saved => saved.itemCode === item.itemCode)) {
      console.warn("Item with this code already exists.");
      return;
    }
    const newItem: BarcodeItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setSavedItems(prevItems => [newItem, ...prevItems]);
  }, [savedItems, setSavedItems]);

  const deleteBarcodeItem = useCallback((id: string) => {
    setSavedItems(prevItems => prevItems.filter(item => item.id !== id));
  }, [setSavedItems]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl mx-auto">
        <Header />

        <div className="my-6">
          <div className="flex justify-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setView('generator')}
              className={`w-1/2 py-2.5 px-4 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors duration-200 ${view === 'generator' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              <BarcodeIcon />
              Generator
            </button>
            <button
              onClick={() => setView('saved')}
              className={`w-1/2 py-2.5 px-4 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors duration-200 ${view === 'saved' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              <ListIcon />
              View Saved ({savedItems.length})
            </button>
          </div>
        </div>

        <main>
          {view === 'generator' ? (
            <BarcodeGenerator onSave={addBarcodeItem} />
          ) : (
            <SavedBarcodes items={savedItems} onDelete={deleteBarcodeItem} />
          )}
        </main>
        
        <footer className="text-center mt-8 text-slate-500 text-xs">
          <p>&copy; {new Date().getFullYear()} Arabtimes. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;