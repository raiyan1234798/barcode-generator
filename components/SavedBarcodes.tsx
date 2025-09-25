import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { BarcodeItem } from '../types';
import { TrashIcon } from './TrashIcon';

declare var JsBarcode: any;

interface SavedBarcodesProps {
  items: BarcodeItem[];
  onDelete: (id: string) => void;
}

const SavedBarcodeCard: React.FC<{ item: BarcodeItem; onDelete: (id: string) => void; }> = ({ item, onDelete }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (isExpanded && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, item.itemCode, {
                    format: 'EAN13',
                    lineColor: '#e2e8f0',
                    background: 'transparent',
                    fontOptions: 'bold',
                    font: 'Inter',
                    fontSize: 16,
                    textMargin: 4,
                    displayValue: true,
                    textColor: '#94a3b8'
                });
            } catch(e) {
                console.error("Failed to generate barcode for saved item", e);
            }
        }
    }, [isExpanded, item.itemCode]);
    
    return (
        <div className="bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(prev => !prev)}>
                <div>
                    <p className="font-semibold text-white">{item.itemName}</p>
                    <p className="text-sm text-slate-400">Code: {item.itemCode} | MRP: {item.mrp.toFixed(2)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                  aria-label="Delete barcode"
                >
                  <TrashIcon />
                </button>
            </div>
            {isExpanded && (
                 <div className="px-4 pb-4 pt-2 bg-slate-800/50">
                     <div className="bg-slate-900/50 p-4 rounded-lg flex flex-col items-center">
                         <div className="w-full max-w-xs">
                             <svg ref={barcodeRef} className="w-full"></svg>
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

const SavedBarcodes: React.FC<SavedBarcodesProps> = ({ items, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(
      item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode.includes(searchTerm)
    );
  }, [items, searchTerm]);

  return (
    <div className="space-y-6">
      <input
        type="text"
        placeholder="Search by name or code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <SavedBarcodeCard key={item.id} item={item} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No saved barcodes found.</p>
          {items.length > 0 && searchTerm && <p className="text-slate-500 text-sm mt-2">Try a different search term.</p>}
        </div>
      )}
    </div>
  );
};

export default SavedBarcodes;