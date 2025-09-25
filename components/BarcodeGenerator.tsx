import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { BarcodeItem } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { PrintIcon } from './icons/PrintIcon';

declare var JsBarcode: any;

interface BarcodeGeneratorProps {
  onSave: (item: Omit<BarcodeItem, 'id' | 'timestamp'>) => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ onSave }) => {
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [mrp, setMrp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<{ name: string, code: string, price: string } | null>(null);
  const [printableSvg, setPrintableSvg] = useState<string>('');

  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (generatedData && barcodeRef.current) {
        try {
            JsBarcode(barcodeRef.current, generatedData.code, {
                format: 'EAN13',
                lineColor: '#000000',
                background: '#FFFFFF',
                fontOptions: 'bold',
                font: 'Inter',
                fontSize: 16,
                textMargin: 4,
                displayValue: true,
                textColor: '#000000',
                width: 2,
                height: 60,
                margin: 10
            });
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(barcodeRef.current);
            setPrintableSvg(svgString);

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to generate barcode.");
            setGeneratedData(null); // Clear data if generation fails
            setPrintableSvg('');
        }
    }
  }, [generatedData]);


  const validateAndGenerate = () => {
    setError(null);
    if (!itemName.trim() || !itemCode.trim() || !mrp.trim()) {
      setError('All fields are required.');
      setGeneratedData(null);
      return;
    }
    if (!/^\d{12}$/.test(itemCode)) {
      setError('Item Code must be exactly 12 digits.');
      setGeneratedData(null);
      return;
    }
    if (isNaN(parseFloat(mrp)) || parseFloat(mrp) <= 0) {
      setError('MRP must be a positive number.');
      setGeneratedData(null);
      return;
    }
    
    const newGeneratedData = { name: itemName, code: itemCode, price: mrp };
    setGeneratedData(newGeneratedData);
    onSave({ itemName, itemCode, mrp: parseFloat(mrp) });
  };

  const getBarcodeAsPng = useCallback(async (data: { name: string, price: string }): Promise<Blob | null> => {
    if (!barcodeRef.current) return null;

    const svgElement = barcodeRef.current;
    const { name } = data;
    const price = `MRP: ${parseFloat(data.price).toFixed(2)}`;

    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return null;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const barcodeImg = new Image();

    const labelWidth = 400;
    const labelHeight = 200;
    const padding = 20;

    finalCanvas.width = labelWidth;
    finalCanvas.height = labelHeight;

    return new Promise((resolve) => {
        barcodeImg.onload = () => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 24px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(name, finalCanvas.width / 2, padding + 24, finalCanvas.width - padding * 2);
            const barcodeTargetWidth = 320;
            const barcodeTargetHeight = (barcodeTargetWidth / barcodeImg.naturalWidth) * barcodeImg.naturalHeight;
            const barcodeX = (finalCanvas.width - barcodeTargetWidth) / 2;
            const barcodeY = 65;
            ctx.drawImage(barcodeImg, barcodeX, barcodeY, barcodeTargetWidth, barcodeTargetHeight);
            ctx.font = 'bold 28px Inter';
            const mrpY = finalCanvas.height - padding;
            ctx.fillText(price, finalCanvas.width / 2, mrpY);
            URL.revokeObjectURL(url);
            finalCanvas.toBlob(blob => resolve(blob), 'image/png');
        };
        barcodeImg.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        barcodeImg.src = url;
    });
  }, []);

  const handlePrint = () => {
    if (!generatedData || !printableSvg) {
      setError("Cannot print. Please generate a barcode first.");
      return;
    }

    const printContainer = document.getElementById('print-area');
    if (!printContainer) {
      setError("Could not find printable area. Please refresh the page.");
      console.error("Fatal: #print-area element not found in the DOM.");
      return;
    }
    
    const price = `MRP: ${parseFloat(generatedData.price).toFixed(2)}`;
    
    printContainer.innerHTML = `
      <div class="printable-label">
        <div class="item-name">${generatedData.name}</div>
        <div class="barcode-svg">${printableSvg}</div>
        <div class="mrp">${price}</div>
      </div>
    `;

    // Use requestAnimationFrame to ensure the DOM is updated before printing
    requestAnimationFrame(() => {
      window.print();
    });
  };


  const handleAction = async (action: 'download' | 'share') => {
    if (!generatedData) {
      setError("Please generate a barcode first.");
      return;
    }

    const blob = await getBarcodeAsPng(generatedData);
    if (!blob) {
      setError(`Could not generate image for ${action}.`);
      return;
    }

    if (action === 'download') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedData.name.replace(/ /g, '_') || 'barcode'}-${generatedData.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (action === 'share') {
      if (!navigator.share) {
        setError('Web Share API is not available on your browser.');
        return;
      }
      const file = new File([blob], `${generatedData.name.replace(/ /g, '_')}-${generatedData.code}.png`, { type: 'image/png' });
      try {
        await navigator.share({
          title: 'ArabTimes Barcode Label',
          text: `Barcode for ${generatedData.name} (MRP: ${generatedData.price})`,
          files: [file],
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err);
          setError('Could not share the barcode.');
        }
      }
    }
  };

  const handleDownload = () => handleAction('download');
  const handleShare = () => handleAction('share');

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg">
      <div className="space-y-6">
        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-slate-300 mb-1">Item Name</label>
          <input type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g., Basmati Rice 1kg" />
        </div>
        <div>
          <label htmlFor="itemCode" className="block text-sm font-medium text-slate-300 mb-1">Item Code (12 Digits for EAN-13)</label>
          <input type="text" id="itemCode" value={itemCode} onChange={(e) => setItemCode(e.target.value.replace(/\D/g, ''))} maxLength={12} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Enter 12-digit code" />
        </div>
        <div>
          <label htmlFor="mrp" className="block text-sm font-medium text-slate-300 mb-1">MRP (Price)</label>
          <input type="number" id="mrp" value={mrp} onChange={(e) => setMrp(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g., 25.50" />
        </div>
        <button onClick={validateAndGenerate} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200">
          Generate & Save
        </button>
        {error && <p className="text-red-400 text-center text-sm mt-2">{error}</p>}
      </div>

      {generatedData && (
        <div className="mt-8 pt-6 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-center mb-4 text-slate-300">Generated Label Preview</h3>
          <div id="label-preview-container" className="p-4 bg-slate-700 rounded-lg">
            <div 
                id="label-preview" 
                className="bg-white p-4 rounded-md max-w-lg mx-auto text-black flex flex-col items-center justify-around aspect-[400/200]"
                aria-label="Barcode label preview"
            >
              <p className="text-center font-bold text-lg leading-tight px-2">{generatedData.name}</p>
              <div className="w-full max-w-xs px-2">
                 <svg ref={barcodeRef} className="w-full h-auto"></svg>
              </div>
              <p className="text-center font-bold text-xl">MRP: {parseFloat(generatedData.price).toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200">
              <DownloadIcon />
              Download PNG
            </button>
            <button onClick={handlePrint} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200">
              <PrintIcon />
              Print Label
            </button>
            {navigator.share && (
              <button onClick={handleShare} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200">
                <ShareIcon />
                Share
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeGenerator;