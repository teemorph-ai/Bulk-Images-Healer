
import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
        Bulk Image Healer
      </h1>
      <p className="text-lg text-slate-400 max-w-2xl mx-auto">
        Automatically remove small, unwanted objects from the corners of your images. Just upload your files, select the corner, and let AI do the rest.
      </p>
    </div>
  );
};
