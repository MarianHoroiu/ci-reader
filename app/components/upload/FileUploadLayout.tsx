'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface FileUploadLayoutProps {
  title: string;
  mode: 'Form' | 'High-Quality' | 'Low-Cost';
  children: React.ReactNode;
}

const getModeConfig = (processingMode: string) => {
  return {
    badge: `${processingMode} Mode`,
    badgeColor: 'bg-blue-100 text-blue-800',
  };
};

export default function FileUploadLayout({
  title,
  mode,
  children,
}: FileUploadLayoutProps) {
  const modeConfig = getModeConfig(mode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ID</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${modeConfig.badgeColor}`}
              >
                {modeConfig.badge}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
          Extraction of Romanian ID Card Data
        </h1>
        {children}
      </div>
    </div>
  );
}
