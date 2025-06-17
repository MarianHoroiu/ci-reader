'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ProcessingMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ProcessingModeSelectorProps {
  modes: ProcessingMode[];
  selectedMode: string;
  onModeSelect: (_modeId: string) => void;
  className?: string;
}

export default function ProcessingModeSelector({
  modes,
  selectedMode,
  onModeSelect,
  className = '',
}: ProcessingModeSelectorProps) {
  return (
    <div className={`flex justify-center space-x-3 ${className}`}>
      {modes.map(mode => {
        const isSelected = selectedMode === mode.id;

        return (
          <div
            key={mode.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onModeSelect(mode.id)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">{mode.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{mode.name}</h3>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </div>
              {isSelected && (
                <div className="flex-shrink-0 ml-3">
                  <Check className="w-5 h-5 text-primary-600" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
