'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { PersonStorage, type StoredPerson } from '@/lib/utils/person-storage';
import StoredPersonsPanel from '@/components/storage/StoredPersonsPanel';

export default function StoredPersonsPage() {
  const [storedPersons, setStoredPersons] = useState<StoredPerson[]>([]);

  useEffect(() => {
    const loadStoredPersons = () => {
      setStoredPersons(PersonStorage.getStoredPersons());
    };

    loadStoredPersons();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadStoredPersons();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('personsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('personsUpdated', handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Stored Persons
                </h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {storedPersons.length} person
              {storedPersons.length !== 1 ? 's' : ''} stored
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {storedPersons.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              No stored persons
            </h2>
            <p className="text-gray-500 mb-6">
              Process some Romanian ID documents to see them here.
            </p>
            <Link
              href="/file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Process Romanian ID
            </Link>
          </div>
        ) : (
          <StoredPersonsPanel className="w-full" alwaysExpanded={true} />
        )}
      </main>
    </div>
  );
}
