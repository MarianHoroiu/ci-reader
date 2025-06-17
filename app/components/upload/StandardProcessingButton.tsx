'use client';

import React from 'react';

interface StandardProcessingButtonProps {
  icon: React.ReactNode;
  text: string;
  modelName?: string;
  color: 'blue' | 'purple' | 'emerald' | 'green' | 'red' | 'yellow';
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorVariants = {
  blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600',
  purple:
    'border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-600',
  emerald:
    'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-600',
  green:
    'border-green-200 hover:border-green-400 hover:bg-green-50 text-green-600',
  red: 'border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600',
  yellow:
    'border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 text-yellow-600',
};

const sizeVariants = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3',
  lg: 'px-8 py-4 text-lg',
};

export default function StandardProcessingButton({
  icon,
  text,
  modelName,
  color,
  onClick,
  disabled = false,
  size = 'md',
  className = '',
}: StandardProcessingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex flex-col items-center border-2 rounded-lg transition-colors font-medium text-gray-900 ${
        colorVariants[color]
      } ${sizeVariants[size]} ${
        disabled
          ? 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white'
          : ''
      } ${className}`}
    >
      <span className="mb-2">{icon}</span>
      <span>{text}</span>
      {modelName && (
        <span className="text-sm text-gray-600 text-center mt-1 font-normal">
          {modelName}
        </span>
      )}
    </button>
  );
}
