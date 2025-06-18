'use client';

import React, { useState, useEffect } from 'react';
import { Users, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { PersonStorage, type StoredPerson } from '@/lib/utils/person-storage';
import AIExtractionResults from '@/components/ai/AIExtractionResults';
import type { RomanianIDExtractionResult } from '@/lib/types/romanian-id-types';

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
  const [editingPerson, setEditingPerson] = useState<StoredPerson | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saveConfirm, setSaveConfirm] = useState<{
    personId: string;
    fields: any;
  } | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [isInEditMode, setIsInEditMode] = useState(false);

  useEffect(() => {
    const handleEditModeChange = (event: any) => {
      setIsInEditMode(event.detail?.isEditing || false);
    };

    window.addEventListener('editModeChanged', handleEditModeChange);

    return () => {
      window.removeEventListener('editModeChanged', handleEditModeChange);
    };
  }, []);

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
    setDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    PersonStorage.removeStoredPerson(id);
    setStoredPersons(PersonStorage.getStoredPersons());
    window.dispatchEvent(new CustomEvent('personsUpdated'));
    setDeleteConfirm(null);
  };

  const handleClearAll = () => {
    setClearAllConfirm(true);
  };

  const confirmClearAll = () => {
    PersonStorage.clearAllPersons();
    setStoredPersons([]);
    window.dispatchEvent(new CustomEvent('personsUpdated'));
    setClearAllConfirm(false);
  };

  const handleEditPerson = (person: StoredPerson) => {
    setEditingPerson(person);
  };

  const handleCloseEdit = () => {
    setEditingPerson(null);
    setIsInEditMode(false);
  };

  const handleUpdatePerson = (personId: string, fields: any) => {
    setSaveConfirm({ personId, fields });
  };

  const confirmSave = () => {
    if (!saveConfirm) return;

    const updatedResult: RomanianIDExtractionResult = {
      fields: saveConfirm.fields,
      metadata: {
        processing_time: 0,
        model: 'stored',
        image_quality: 'good' as const,
        warnings: [],
      },
    };

    PersonStorage.updateStoredPerson(saveConfirm.personId, updatedResult);
    setStoredPersons(PersonStorage.getStoredPersons());
    handleCloseEdit();
    setSaveConfirm(null);
    window.dispatchEvent(new CustomEvent('personsUpdated'));
  };

  const convertPersonToExtractionResult = (
    person: StoredPerson
  ): RomanianIDExtractionResult => {
    return {
      fields: {
        nume: person.nume,
        prenume: person.prenume,
        cnp: person.cnp,
        nationalitate: person.nationalitate,
        sex: person.sex,
        data_nasterii: person.data_nasterii,
        locul_nasterii: person.locul_nasterii,
        domiciliul: person.domiciliul,
        tip_document: person.tip_document,
        seria: person.seria,
        numar: person.numar,
        data_eliberarii: person.data_eliberarii,
        valabil_pana_la: person.valabil_pana_la,
        eliberat_de: person.eliberat_de,
      },
      metadata: {
        processing_time: 0,
        model: 'stored',
        image_quality: 'good' as const,
        warnings: [],
      },
    };
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPerson(person)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit person"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemovePerson(person.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove person"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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

      {/* Edit Modal */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {isInEditMode ? 'Edit Person Data' : 'View Person Data'}
              </h2>
              <button
                onClick={handleCloseEdit}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <AIExtractionResults
                result={convertPersonToExtractionResult(editingPerson)}
                editable={true}
                onFieldsUpdate={fields =>
                  handleUpdatePerson(editingPerson.id, fields)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this person&apos;s data? This
                action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {saveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Save Changes
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to save these changes to the person&apos;s
                data?
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSaveConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {clearAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Clear All
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete ALL stored persons data? This
                action cannot be undone and will permanently remove all{' '}
                {storedPersons.length} person
                {storedPersons.length !== 1 ? 's' : ''} from storage.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setClearAllConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearAll}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
