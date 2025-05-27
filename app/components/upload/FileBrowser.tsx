'use client';

import { forwardRef } from 'react';
import UploadButton from './UploadButton';

export interface FileBrowserProps {
  accept?: string;
  disabled?: boolean;
  onFileSelect?: (_files: File[]) => void;
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'minimal';
  buttonSize?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const FileBrowser = forwardRef<HTMLInputElement, FileBrowserProps>(
  (
    {
      accept = 'image/jpeg,image/png,image/webp,application/pdf',
      disabled = false,
      onFileSelect,
      buttonText = 'Browse Files',
      buttonVariant = 'secondary',
      buttonSize = 'md',
      showIcon = true,
      className = '',
    },
    ref
  ) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        onFileSelect?.(fileArray);
      }

      // Reset input value to allow selecting the same file again
      event.target.value = '';
    };

    const handleButtonClick = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.click();
      }
    };

    return (
      <div className={`inline-block ${className}`}>
        <input
          ref={ref}
          type="file"
          multiple={false}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
        <UploadButton
          variant={buttonVariant}
          size={buttonSize}
          showIcon={showIcon}
          disabled={disabled}
          onClick={handleButtonClick}
          type="button"
        >
          {buttonText}
        </UploadButton>
      </div>
    );
  }
);

FileBrowser.displayName = 'FileBrowser';

export default FileBrowser;
