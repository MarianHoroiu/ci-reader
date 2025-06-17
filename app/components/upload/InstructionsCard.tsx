'use client';

import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface InstructionsCardProps {
  type: 'warning' | 'info' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
  },
};

export default function InstructionsCard({
  type,
  title,
  children,
  className = '',
}: InstructionsCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}
    >
      <div className="flex">
        <Icon
          className={`w-5 h-5 ${config.iconColor} mr-3 mt-0.5 flex-shrink-0`}
        />
        <div className="flex-1">
          {title && (
            <h3 className={`font-medium ${config.titleColor} mb-2`}>{title}</h3>
          )}
          <div className={config.textColor}>{children}</div>
        </div>
      </div>
    </div>
  );
}
