'use client';

/**
 * AI Extraction Results Component
 * Displays extracted Romanian ID data with editing and export capabilities
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Edit3, Save, Check, AlertCircle, X, User, Copy } from 'lucide-react';
import type {
  RomanianIDExtractionResult,
  RomanianIDFields,
} from '@/lib/types/romanian-id-types';
import { type StoredPerson } from '@/lib/db/database';
import { usePersonStorage } from '@/hooks/usePersonStorage';

export interface AIExtractionResultsProps {
  /** Extraction result from AI processing */
  result: RomanianIDExtractionResult;
  /** Whether fields can be edited */
  editable?: boolean;
  /** Callback when fields are updated */
  onFieldsUpdate?: (_fields: RomanianIDFields) => void;
  /** Callback to clear/reset the process */
  onClear?: () => void;
  /** Whether this is newly extracted data (true) or existing stored data (false) */
  isNewData?: boolean;
  /** Custom className */
  className?: string;
  /** Person ID for existing persons (enables update instead of create) */
  personId?: string;
}

/**
 * AI Extraction Results Component
 */
export default function AIExtractionResults({
  result,
  editable = true,
  onFieldsUpdate,
  onClear,
  isNewData = false,
  className = '',
  personId,
}: AIExtractionResultsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<RomanianIDFields>(
    result.fields
  );
  const [originalFields, setOriginalFields] = useState<RomanianIDFields>(
    result.fields
  );
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(isNewData); // New data should be saveable initially
  const [duplicateInfo, setDuplicateInfo] = useState<{
    existingPerson: StoredPerson;
    show: boolean;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState<{
    fieldName: string;
    message: string;
  } | null>(null);

  // Use the new Dexie-based storage hook
  const { addPersonFromExtraction, updatePerson, findPersonByCNP } =
    usePersonStorage();

  // Track changes when fields are edited
  useEffect(() => {
    if (isNewData) {
      // For new data: keep enabled until first save, then track changes
      if (isSaved) {
        const fieldsChanged =
          JSON.stringify(editedFields) !== JSON.stringify(originalFields);
        setHasChanges(fieldsChanged);
      } else {
        // For new data that hasn't been saved yet, enable save button by default
        setHasChanges(true);
      }
    } else {
      // For existing data: only enable when changes are made
      const fieldsChanged =
        JSON.stringify(editedFields) !== JSON.stringify(originalFields);
      setHasChanges(fieldsChanged);
    }
  }, [editedFields, originalFields, isNewData, isSaved]);

  /**
   * Handle field value change
   */
  const handleFieldChange = useCallback(
    (fieldName: keyof RomanianIDFields, value: string) => {
      setEditedFields(prev => ({
        ...prev,
        [fieldName]: value.trim() || null,
      }));
    },
    []
  );

  /**
   * Cancel editing and revert to original fields
   */
  const handleCancel = useCallback(() => {
    setEditedFields(originalFields);
    setIsEditing(false);
    setHasChanges(false);
    window.dispatchEvent(
      new CustomEvent('editModeChanged', { detail: { isEditing: false } })
    );
  }, [originalFields]);

  /**
   * Start editing mode
   */
  const handleStartEdit = useCallback(() => {
    setOriginalFields(editedFields);
    setIsEditing(true);
    window.dispatchEvent(
      new CustomEvent('editModeChanged', { detail: { isEditing: true } })
    );
  }, [editedFields]);

  /**
   * Save edited fields, bypassing duplicate check if forced
   */
  const handleSave = useCallback(
    async (forceSave = false) => {
      try {
        let existingPersonId = personId;

        // Check for duplicates first (only if this is new data and not forced)
        if (isNewData && editedFields.cnp && !forceSave) {
          const duplicateResult = await findPersonByCNP(editedFields.cnp);
          if (duplicateResult.success && duplicateResult.person) {
            setDuplicateInfo({
              existingPerson: duplicateResult.person,
              show: true,
            });
            return; // Don't save, let user decide
          }
        }

        // If this is new data and we found a duplicate (forceSave = true), update the existing person
        if (isNewData && editedFields.cnp && forceSave) {
          const duplicateResult = await findPersonByCNP(editedFields.cnp);
          if (duplicateResult.success && duplicateResult.person) {
            existingPersonId = duplicateResult.person.id;
          }
        }

        let saveResult;

        if (existingPersonId) {
          // Update existing person
          const updates = {
            nume: editedFields.nume || '',
            prenume: editedFields.prenume || '',
            cnp: editedFields.cnp || '',
            nationalitate: editedFields.nationalitate || '',
            sex: editedFields.sex || '',
            data_nasterii: editedFields.data_nasterii || '',
            locul_nasterii: editedFields.locul_nasterii || '',
            domiciliu: editedFields.domiciliul || '',
            tip_document: editedFields.tip_document || '',
            seria_buletin: editedFields.seria_buletin || '',
            numar_buletin: editedFields.numar_buletin || '',
            valabilitate: editedFields.valabil_pana_la || '',
            emis_de: editedFields.eliberat_de || '',
            data_eliberarii: editedFields.data_eliberarii || '',
          };
          saveResult = await updatePerson(existingPersonId, updates);
        } else {
          // Create new person
          const extractionResult: RomanianIDExtractionResult = {
            fields: editedFields,
            metadata: result.metadata,
          };
          saveResult = await addPersonFromExtraction(extractionResult);
        }
        if (saveResult.success) {
          setIsSaved(true);
          setHasChanges(false);
          setOriginalFields(editedFields); // Update original fields to current state
          setDuplicateInfo(null); // Close duplicate modal if open
          onFieldsUpdate?.(editedFields);

          setTimeout(() => setIsSaved(false), 2000);
        } else {
          console.error('Error saving person data:', saveResult.error);
        }
      } catch (error) {
        console.error('Error saving person data:', error);
      }
    },
    [
      editedFields,
      onFieldsUpdate,
      addPersonFromExtraction,
      updatePerson,
      personId,
      isNewData,
      findPersonByCNP,
      result.metadata,
    ]
  );

  /**
   * Handle saving anyway despite duplicate warning
   */
  const handleSaveAnyway = useCallback(() => {
    handleSave(true);
  }, [handleSave]);

  /**
   * Handle dismissing the duplicate modal
   */
  const handleDismissDuplicate = useCallback(() => {
    setDuplicateInfo(null);
  }, []);

  const formatFieldName = (fieldName: string): string => {
    const fieldLabels: Record<string, string> = {
      nume: 'Last Name',
      prenume: 'First Name',
      cnp: 'CNP',
      nationalitate: 'Nationality',
      sex: 'Gender',
      data_nasterii: 'Birth Date',
      locul_nasterii: 'Birth Place',
      domiciliul: 'Address',
      tip_document: 'Document Type',
      seria_buletin: 'Series',
      numar_buletin: 'Number',
      data_eliberarii: 'Issue Date',
      valabil_pana_la: 'Valid Until',
      eliberat_de: 'Issued By',
    };
    return fieldLabels[fieldName] || fieldName;
  };

  // Filter out informational messages that don't need UI display
  const importantWarnings =
    result.metadata.warnings?.filter(
      warning => !warning.includes('Structured data extracted using Claude AI')
    ) || [];
  const hasWarnings = importantWarnings.length > 0;

  const formatPersonName = (person: StoredPerson): string => {
    const nume = person.nume || '';
    const prenume = person.prenume || '';
    return `${nume} ${prenume}`.trim() || 'Unknown Person';
  };

  const copyToClipboard = useCallback(
    async (value: string | null, fieldName: string) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopySuccess({
          fieldName,
          message: `${formatFieldName(fieldName)} copied to clipboard`,
        });
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        setCopySuccess({
          fieldName,
          message: 'Failed to copy to clipboard',
        });
        setTimeout(() => setCopySuccess(null), 2000);
      }
    },
    []
  );

  return (
    <div className={`bg-white rounded-lg shadow-md border ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Extraction Results
            </h3>
            <p className="text-sm text-gray-500">
              Processing time: {result.metadata.processing_time}ms
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSave()}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isSaved
                ? 'bg-green-100 text-green-700'
                : hasChanges
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={hasChanges ? 'Save to storage' : 'No changes to save'}
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Saved!' : 'Save'}</span>
          </button>

          {onClear && (
            <button
              onClick={onClear}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Clear and start over"
            >
              <X className="w-4 h-4" />
              <span>Clear & Start Over</span>
            </button>
          )}

          {editable && !isEditing && (
            <button
              onClick={handleStartEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}

          {editable && isEditing && (
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {hasWarnings && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
              <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                {importantWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(editedFields).map(([fieldName, value]) => (
            <div key={fieldName} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(fieldName)}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={value || ''}
                  onChange={e =>
                    handleFieldChange(
                      fieldName as keyof RomanianIDFields,
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="relative">
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg pr-10">
                    <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                      {value || 'Not detected'}
                    </span>
                  </div>
                  {value && (
                    <button
                      onClick={() => copyToClipboard(value, fieldName)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  {/* Contextual Copy Success Toast */}
                  {copySuccess && copySuccess.fieldName === fieldName && (
                    <div className="absolute -top-10 right-0 bg-green-600 text-white px-3 py-1 rounded text-sm shadow-lg z-50 flex items-center space-x-2 whitespace-nowrap">
                      <Check className="w-3 h-3" />
                      <span>{copySuccess.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Duplicate CNP Modal */}
      {duplicateInfo?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Duplicate CNP Found
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                A person with the same CNP ({duplicateInfo.existingPerson.cnp})
                already exists in storage:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-medium text-gray-900">
                  {formatPersonName(duplicateInfo.existingPerson)}
                </p>
                <p className="text-sm text-gray-500">
                  Saved:{' '}
                  {new Date(
                    duplicateInfo.existingPerson.timestamp
                  ).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                You can still save this data if you want to keep both entries,
                or you can clear and start over.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDismissDuplicate}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAnyway}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
