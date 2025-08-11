'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminToggle() {
  return (
    <Link 
      href="/admin" 
      className="px-4 py-2 bg-black text-white hover:bg-gray-800 rounded transition-colors ml-2"
    >
      Admin
    </Link>
  );
} 