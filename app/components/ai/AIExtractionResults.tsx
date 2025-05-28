'use client';

/**
 * AI Extraction Results Component
 * Displays extracted Romanian ID data with editing and export capabilities
 */

import React, { useState, useCallback } from 'react';
import { Edit3, Save, X, Download, Copy } from 'lucide-react';
import type {
  RomanianIDExtractionResult,
  RomanianIDFields,
} from '@/lib/types/romanian-id-types';
import {
  formatRomanianIDFields,
  generateExportData,
  downloadExportedData,
} from '@/lib/utils/ai-integration-utils';

export interface AIExtractionResultsProps {
  /** Extraction result from AI processing */
  result: RomanianIDExtractionResult;
  /** Whether fields can be edited */
  editable?: boolean;
  /** Callback when fields are updated */
  onFieldsUpdate?: (_fields: RomanianIDFields) => void;
  /** Callback when export is requested */
  onExport?: (_format: 'json' | 'csv' | 'txt') => void;
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
  onExport,
  className = '',
}: AIExtractionResultsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<RomanianIDFields>(
    result.fields
  );

  const formattedFields = formatRomanianIDFields(editedFields);

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
  const handleSave = useCallback(() => {
    setIsEditing(false);
    onFieldsUpdate?.(editedFields);
  }, [editedFields, onFieldsUpdate]);

  /**
   * Cancel editing
   */
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedFields(result.fields);
  }, [result.fields]);

  /**
   * Handle export
   */
  const handleExport = useCallback(
    (format: 'json' | 'csv' | 'txt') => {
      const exportData = generateExportData(
        { ...result, fields: editedFields },
        format
      );

      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'txt' ? 'txt' : format;
      const filename = `romanian-id-extraction-${timestamp}.${extension}`;

      const mimeTypes = {
        json: 'application/json',
        csv: 'text/csv',
        txt: 'text/plain',
      };

      downloadExportedData(exportData, filename, mimeTypes[format]);
      onExport?.(format);
    },
    [result, editedFields, onExport]
  );

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

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Date Extrase din Buletin
            </h2>
          </div>

          {/* Edit toggle */}
          {editable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title={isEditing ? 'Anulează editarea' : 'Editează câmpurile'}
            >
              {isEditing ? (
                <X className="w-4 h-4" />
              ) : (
                <Edit3 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Action buttons */}
        {isEditing && (
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvează
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Anulează
            </button>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(formattedFields).map(([fieldName, field]) => {
            return (
              <div key={fieldName} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                </label>

                <div className="relative">
                  {isEditing ? (
                    <input
                      type="text"
                      value={
                        editedFields[fieldName as keyof RomanianIDFields] || ''
                      }
                      onChange={e =>
                        handleFieldChange(
                          fieldName as keyof RomanianIDFields,
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Introduceți ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <div className="flex items-center">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {field.formatted}
                      </div>
                      {field.value && (
                        <button
                          onClick={() => handleCopyField(field.value)}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Copiază în clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export section */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Exportă Datele
            </h3>
            <p className="text-xs text-gray-600">
              Descarcă datele extrase în diferite formate
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('json')}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </button>
            <button
              onClick={() => handleExport('txt')}
              className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              TXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
