'use client';

import React, { useState, useEffect } from 'react';
import { Users, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { PersonStorage, type StoredPerson } from '@/lib/utils/person-storage';

interface StoredPersonsPanelProps {
  className?: string;
  alwaysExpanded?: boolean;
}

export default function StoredPersonsPanel({
  className = '',
  alwaysExpanded = false,
}: StoredPersonsPanelProps) {
  const [storedPersons, setStoredPersons] = useState<StoredPerson[]>([]);
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded);

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

    // Custom event for same-tab updates
    window.addEventListener('personsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('personsUpdated', handleStorageChange);
    };
  }, []);

  const handleRemovePerson = (id: string) => {
    PersonStorage.removeStoredPerson(id);
    setStoredPersons(PersonStorage.getStoredPersons());
    window.dispatchEvent(new CustomEvent('personsUpdated'));
  };

  const handleClearAll = () => {
    PersonStorage.clearAllPersons();
    setStoredPersons([]);
    window.dispatchEvent(new CustomEvent('personsUpdated'));
  };

  const formatName = (person: StoredPerson): string => {
    const nume = person.nume || 'Unknown';
    const prenume = person.prenume || '';
    return prenume ? `${nume}, ${prenume}` : nume;
  };

  if (storedPersons.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border ${className}`}>
      <div
        className={`flex items-center justify-between p-4 ${!alwaysExpanded ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={!alwaysExpanded ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Stored Persons ({storedPersons.length})
          </h3>
        </div>
        {!alwaysExpanded &&
          (isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ))}
      </div>

      {(alwaysExpanded || isExpanded) && (
        <div className="border-t border-gray-200">
          <div className="p-4 space-y-3">
            {storedPersons.map(person => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {formatName(person)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(person.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemovePerson(person.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove person"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {storedPersons.length > 1 && (
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={handleClearAll}
                  className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Clear All Persons
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
