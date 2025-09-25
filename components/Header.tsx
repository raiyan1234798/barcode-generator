
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
        Arabtimes Barcode Pro
      </h1>
      <p className="text-slate-400 mt-2">Create and manage barcodes for your inventory.</p>
    </header>
  );
};

export default Header;