'use client';

import React from 'react';
import Image from 'next/image';
import { X, FileImage } from 'lucide-react';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface FilePreviewCardProps {
  file: UploadedFile;
  onRemove: (_id: string) => void;
  isSelected?: boolean;
  onSelect?: (_file: UploadedFile) => void;
  children?: React.ReactNode;
  className?: string;
}

export default function FilePreviewCard({
  file,
  onRemove,
  isSelected = false,
  onSelect,
  children,
  className = '',
}: FilePreviewCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(file.id);
  };

  return (
    <div
      className={`relative bg-white rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-200'
          : 'border-gray-200 hover:border-gray-300'
      } ${onSelect ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      <button
        onClick={handleRemove}
        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="p-4">
        <div className="mb-3">
          <Image
            src={file.preview}
            alt="Uploaded file"
            width={200}
            height={150}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <FileImage className="w-4 h-4 mr-1" />
            <span className="truncate">{file.file.name}</span>
          </div>
          <div className="text-xs text-gray-500">
            {(file.file.size / 1024 / 1024).toFixed(2)} MB
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
