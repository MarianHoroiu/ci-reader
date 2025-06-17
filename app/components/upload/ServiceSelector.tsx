import React from 'react';
import { Cpu, Cloud, ArrowRight } from 'lucide-react';

export interface ServiceSelectorProps {
  showLocal?: boolean;
  showCloud?: boolean;
  showBoth?: boolean;
  disabled?: boolean;
  hasFileSelected: boolean;
  onSelectLocal?: () => void;
  onSelectCloud?: () => void;
  onSelectBoth?: () => void;
  localModelName?: string;
  cloudModelName?: string;
  bothDescription?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  showLocal = false,
  showCloud = false,
  showBoth = false,
  disabled = false,
  hasFileSelected,
  onSelectLocal,
  onSelectCloud,
  onSelectBoth,
  localModelName,
  cloudModelName,
  bothDescription,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Processing Method
        </h3>
        {!hasFileSelected && (
          <span className="text-sm text-red-600 font-medium">
            ⚠️ Please select a file first
          </span>
        )}
      </div>
      <div
        className={`grid grid-cols-1 md:grid-cols-${[showLocal, showCloud, showBoth].filter(Boolean).length} gap-4`}
      >
        {showLocal && (
          <button
            onClick={onSelectLocal}
            disabled={disabled || !hasFileSelected}
            className="flex flex-col items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-blue-200 disabled:hover:bg-white"
          >
            <Cpu className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Local Processing</h4>
            <p className="text-sm text-gray-600 text-center mt-1">
              {localModelName || 'Local Model'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Private
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Offline
              </span>
            </div>
          </button>
        )}
        {showCloud && (
          <button
            onClick={onSelectCloud}
            disabled={disabled || !hasFileSelected}
            className="flex flex-col items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-purple-200 disabled:hover:bg-white"
          >
            <Cloud className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Cloud Processing</h4>
            <p className="text-sm text-gray-600 text-center mt-1">
              {cloudModelName || 'Cloud Service'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                High Accuracy
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                Online
              </span>
            </div>
          </button>
        )}
        {showBoth && (
          <button
            onClick={onSelectBoth}
            disabled={disabled || !hasFileSelected}
            className="flex flex-col items-center p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-emerald-200 disabled:hover:bg-white"
          >
            <div className="flex items-center mb-2">
              <Cpu className="w-6 h-6 text-emerald-600" />
              <ArrowRight className="w-4 h-4 text-emerald-600 mx-1" />
              <Cloud className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-medium text-gray-900">Compare Both</h4>
            <p className="text-sm text-gray-600 text-center mt-1">
              {bothDescription || 'Side-by-side comparison'}
            </p>
            <div className="mt-2">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded">
                Recommended
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export const ProcessingButton = ({
  icon,
  text,
  modelName,
  color,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  text: string;
  modelName?: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex flex-col items-center px-6 py-3 border-2 border-${color}-200 rounded-lg hover:border-${color}-400 hover:bg-${color}-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-${color}-200 disabled:hover:bg-white`}
  >
    <span className={`mb-2`}>{icon}</span>
    <span className="font-medium text-gray-900">{text}</span>
    {modelName && (
      <span className="text-sm text-gray-600 text-center mt-1">
        {modelName}
      </span>
    )}
  </button>
);

export default ServiceSelector;
