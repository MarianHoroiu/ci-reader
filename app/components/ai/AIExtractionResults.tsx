'use client';

/**
 * AI Extraction Results Component
 * Displays extracted Romanian ID data with editing and export capabilities
 */

import React, { useState, useCallback } from 'react';
import { Edit3, Save, Copy, Check, AlertCircle } from 'lucide-react';
import type {
  RomanianIDExtractionResult,
  RomanianIDFields,
} from '@/lib/types/romanian-id-types';
import { PersonStorage } from '@/lib/utils/person-storage';

export interface AIExtractionResultsProps {
  /** Extraction result from AI processing */
  result: RomanianIDExtractionResult;
  /** Whether fields can be edited */
  editable?: boolean;
  /** Callback when fields are updated */
  onFieldsUpdate?: (_fields: RomanianIDFields) => void;
  /** Custom className */
  className?: string;
}

/**
 * AI Extraction Results Component
 */
export default function AIExtractionResults({
  result,
  editable = true,
  onFieldsUpdate,
  className = '',
}: AIExtractionResultsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<RomanianIDFields>(
    result.fields
  );
  const [isSaved, setIsSaved] = useState(false);

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
   * Save edited fields
   */
  const handleSave = useCallback(async () => {
    try {
      const updatedResult = {
        ...result,
        fields: editedFields,
      };
      PersonStorage.saveExtractedPerson(updatedResult);
      setIsSaved(true);
      onFieldsUpdate?.(editedFields);
      window.dispatchEvent(new CustomEvent('personsUpdated'));

      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving person data:', error);
    }
  }, [result, editedFields, onFieldsUpdate]);

  /**
   * Copy field value to clipboard
   */
  const handleCopyField = useCallback(async (value: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
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
      seria: 'Series',
      numar: 'Number',
      data_eliberarii: 'Issue Date',
      valabil_pana_la: 'Valid Until',
      eliberat_de: 'Issued By',
    };
    return fieldLabels[fieldName] || fieldName;
  };

  const hasWarnings = result.metadata.warnings?.length > 0;

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
            onClick={handleSave}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isSaved
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            title="Save to storage"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Saved!' : 'Save'}</span>
          </button>

          {editable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Done' : 'Edit'}</span>
            </button>
          )}

          <button
            onClick={() => handleCopyField(editedFields.cnp)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Copy CNP to clipboard"
          >
            <Copy className="w-4 h-4" />
            <span>Copy CNP</span>
          </button>
        </div>
      </div>

      {hasWarnings && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
              <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                {result.metadata.warnings?.map((warning, index) => (
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
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value || 'Not detected'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
