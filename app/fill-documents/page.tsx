'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { PersonStorage, type StoredPerson } from '@/lib/utils/person-storage';

interface DocumentTemplate {
  id: string;
  name: string;
  path: string;
  lastModified: string;
}

export default function FillDocumentsPage() {
  const [storedPersons, setStoredPersons] = useState<StoredPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<StoredPerson | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

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

  // Load templates from file system
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates([]);
      }
    };

    loadTemplates();
  }, []);

  const formatPersonName = (person: StoredPerson): string => {
    const nume = person.nume || 'Unknown';
    const prenume = person.prenume || '';
    return prenume ? `${nume}, ${prenume}` : nume;
  };

  const handleFillDocument = () => {
    if (!selectedPerson || !selectedTemplate) return;
    // This will be implemented later
    console.log(
      'Fill document:',
      selectedTemplate.name,
      'with person:',
      formatPersonName(selectedPerson)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Fill Documents
                </h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {storedPersons.length} person
              {storedPersons.length !== 1 ? 's' : ''} • {templates.length}{' '}
              template{templates.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Stored Persons Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Stored Persons
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {storedPersons.length}
                </span>
              </div>
            </div>

            <div className="overflow-hidden">
              {storedPersons.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No stored persons found</p>
                  <Link
                    href="/file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Process Romanian ID
                  </Link>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {storedPersons.map(person => (
                    <div
                      key={person.id}
                      onClick={() => setSelectedPerson(person)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 ${
                        selectedPerson?.id === person.id
                          ? 'bg-blue-50 border-blue-200'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatPersonName(person)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(person.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedPerson?.id === person.id && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Document Templates Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Document Templates
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {templates.length}
                </span>
              </div>
            </div>

            <div className="overflow-hidden">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No templates found</p>
                  <p className="text-sm text-gray-400 px-4">
                    Add .docx files to <br />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      /Desktop/CI-Reader/Documents/Templates/
                    </code>
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-emerald-50 ${
                        selectedTemplate?.id === template.id
                          ? 'bg-emerald-50 border-emerald-200'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {template.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Modified: {template.lastModified}
                          </p>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {selectedPerson && selectedTemplate && (
          <div className="mt-8 text-center">
            <button
              onClick={handleFillDocument}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FileText className="w-5 h-5 mr-2" />
              Fill &ldquo;{selectedTemplate.name}&rdquo; with{' '}
              {formatPersonName(selectedPerson)}&apos;s data
            </button>
          </div>
        )}

        {/* Selection Status */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Selection Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${selectedPerson ? 'bg-blue-500' : 'bg-gray-300'}`}
              ></div>
              <span className="text-sm text-gray-600">
                Person:{' '}
                {selectedPerson
                  ? formatPersonName(selectedPerson)
                  : 'None selected'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${selectedTemplate ? 'bg-emerald-500' : 'bg-gray-300'}`}
              ></div>
              <span className="text-sm text-gray-600">
                Template:{' '}
                {selectedTemplate ? selectedTemplate.name : 'None selected'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
