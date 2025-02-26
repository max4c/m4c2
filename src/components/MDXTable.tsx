'use client';

import React from 'react';
import Table from './Table';

interface MDXTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  caption?: string;
  className?: string;
}

const MDXTable: React.FC<MDXTableProps> = (props) => {
  return <Table {...props} />;
};

export default MDXTable; 