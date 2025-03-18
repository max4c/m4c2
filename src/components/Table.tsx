'use client';

import React, { useEffect, useState } from 'react';

interface TableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  caption?: string;
  className?: string;
}

const Table: React.FC<TableProps> = ({ headers, rows, caption, className = '' }) => {
  // Add client-side hydration handling
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Simple server-side version for initial render
  if (!isClient) {
    return (
      <div className="overflow-x-auto my-6">
        <table className={`min-w-full border-collapse ${className}`}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="py-3 px-4 text-left font-semibold border">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-3 px-4 border">
                    {typeof cell === 'string' ? cell : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  // Client-side fully styled version with explicit gray backgrounds for dark mode
  return (
    <div className="overflow-x-auto my-6">
      <table className={`min-w-full border-collapse ${className}`}>
        {caption && <caption className="text-sm text-gray-600 dark:text-gray-400 mb-2">{caption}</caption>}
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {headers.map((header, index) => (
              <th 
                key={index} 
                className="py-3 px-4 text-left font-semibold border border-gray-200 dark:border-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
            >
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex} 
                  className="py-3 px-4 border border-gray-200 dark:border-gray-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table; 