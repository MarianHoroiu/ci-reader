'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { UploadPhase } from '@/lib/utils/progress-calculator';
import ProgressBar, { CircularProgress, MiniProgress } from './ProgressBar';
import UploadStatus, { MultiUploadStatus } from './UploadStatus';
import StatusMessage, { StatusToast, StatusMessageList } from './StatusMessage';
import CancelButton, {
  CancelAllButton,
  FloatingCancelButton,
} from './CancelButton';

export default function UploadProgressDemo() {
  const [demoPhase, setDemoPhase] = useState<UploadPhase>('uploading');
  const [demoProgress, setDemoProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      phase: UploadPhase;
      message?: string;
      details?: string;
      dismissible?: boolean;
    }>
  >([]);

  const {
    progress,
    multiFileProgress,
    startUpload,
    updateFileProgress,
    setPhase,
    cancelUpload,
    cancelAllUploads,
    completeUpload,
    clearProgress,
  } = useUploadProgress({
    onProgress: (fileId, progressState) => {
      console.log(`Progress for ${fileId}:`, progressState);
    },
    onPhaseChange: (fileId, phase) => {
      console.log(`Phase changed for ${fileId}:`, phase);
    },
    onComplete: fileId => {
      console.log(`Upload completed for ${fileId}`);
    },
    onError: (fileId, error) => {
      console.log(`Upload failed for ${fileId}:`, error);
    },
    onCancel: fileId => {
      console.log(`Upload cancelled for ${fileId}`);
    },
  });

  // Demo progress simulation
  useEffect(() => {
    if (demoProgress < 100 && demoPhase === 'uploading') {
      const timer = setTimeout(() => {
        setDemoProgress(prev => Math.min(prev + Math.random() * 10, 100));
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [demoProgress, demoPhase]);

  const handleStartDemo = () => {
    const fileId = `demo-${Date.now()}`;
    const mockFile = new File(['demo content'], 'demo-file.pdf', {
      type: 'application/pdf',
    });

    startUpload(fileId, mockFile);

    // Simulate progress updates
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
        setTimeout(() => completeUpload(fileId), 500);
      }
      updateFileProgress(
        fileId,
        Math.floor((currentProgress / 100) * mockFile.size)
      );
    }, 300);
  };

  const handlePhaseDemo = (phase: UploadPhase) => {
    const fileId = Array.from(progress.keys())[0];
    if (fileId) {
      setPhase(fileId, phase, phase === 'complete' ? 100 : Math.random() * 100);
    }
  };

  const addMessage = (phase: UploadPhase) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      phase,
      message: `Demo ${phase} message`,
      details: `This is a demo message for the ${phase} phase`,
      dismissible: true,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const dismissMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const phases: UploadPhase[] = [
    'uploading',
    'validating',
    'compressing',
    'complete',
    'error',
    'cancelled',
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Progress Indicators Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive demonstration of all upload progress components
        </p>
      </div>

      {/* Progress Bars Demo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Progress Bars
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interactive Demo Progress: {demoProgress.toFixed(0)}%
            </h3>
            <ProgressBar
              percentage={demoProgress}
              phase={demoPhase}
              size="lg"
              showPercentage={true}
              animated={true}
            />
            <div className="flex space-x-2 mt-2">
              {phases.map(phase => (
                <button
                  key={phase}
                  onClick={() => setDemoPhase(phase)}
                  className={`px-2 py-1 text-xs rounded ${
                    demoPhase === phase
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Small</h4>
              <ProgressBar percentage={75} phase="uploading" size="sm" />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Medium</h4>
              <ProgressBar percentage={50} phase="validating" size="md" />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Large</h4>
              <ProgressBar percentage={90} phase="compressing" size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Circular Progress</h4>
              <div className="flex space-x-4">
                <CircularProgress percentage={25} phase="uploading" size={60} />
                <CircularProgress percentage={75} phase="complete" size={80} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Mini Progress</h4>
              <div className="space-y-2">
                <MiniProgress percentage={30} phase="uploading" />
                <MiniProgress percentage={100} phase="complete" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Upload Status Demo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upload Status Components
        </h2>

        <div className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handleStartDemo}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Start Demo Upload
            </button>
            {Array.from(progress.keys()).map(fileId => (
              <div key={fileId} className="flex space-x-1">
                {phases.map(phase => (
                  <button
                    key={phase}
                    onClick={() => handlePhaseDemo(phase)}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
                  >
                    {phase}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {Array.from(progress.entries()).map(([fileId, progressState]) => (
            <div key={fileId} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <UploadStatus
                  fileId={fileId}
                  fileName="demo-document.pdf"
                  fileSize={1024 * 1024 * 2.5} // 2.5MB
                  progress={progressState}
                  variant="compact"
                  onCancel={cancelUpload}
                />
                <UploadStatus
                  fileId={fileId}
                  fileName="demo-document.pdf"
                  fileSize={1024 * 1024 * 2.5}
                  progress={progressState}
                  variant="default"
                  onCancel={cancelUpload}
                />
                <UploadStatus
                  fileId={fileId}
                  fileName="demo-document.pdf"
                  fileSize={1024 * 1024 * 2.5}
                  progress={progressState}
                  variant="detailed"
                  onCancel={cancelUpload}
                />
              </div>
            </div>
          ))}

          {multiFileProgress.files.size > 0 && (
            <MultiUploadStatus
              files={
                new Map(
                  Array.from(multiFileProgress.files.entries()).map(
                    ([id, progress]) => [
                      id,
                      {
                        fileName: `demo-file-${id.split('-')[1]}.pdf`,
                        fileSize: 1024 * 1024 * 2.5,
                        progress,
                      },
                    ]
                  )
                )
              }
              overallProgress={multiFileProgress.overallProgress}
              onCancelFile={cancelUpload}
              onCancelAll={cancelAllUploads}
            />
          )}
        </div>
      </motion.section>

      {/* Status Messages Demo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Status Messages
        </h2>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {phases.map(phase => (
              <button
                key={phase}
                onClick={() => addMessage(phase)}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md"
              >
                Add {phase} message
              </button>
            ))}
            <button
              onClick={() => setShowToast(true)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded-md"
            >
              Show Toast
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Default</h4>
              <StatusMessage
                phase="uploading"
                message="Default status message"
                details="This is a detailed description"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Compact</h4>
              <StatusMessage
                phase="complete"
                message="Compact status message"
                variant="compact"
                dismissible={true}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Banner</h4>
              <StatusMessage
                phase="error"
                message="Banner status message"
                details="Error details here"
                variant="banner"
                dismissible={true}
              />
            </div>
          </div>

          {messages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Message List</h4>
              <StatusMessageList
                messages={messages}
                onDismiss={dismissMessage}
              />
            </div>
          )}
        </div>
      </motion.section>

      {/* Cancel Buttons Demo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Cancel Buttons
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Default</h4>
              <CancelButton onCancel={() => console.log('Cancel clicked')} />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Compact</h4>
              <CancelButton
                onCancel={() => console.log('Cancel clicked')}
                variant="compact"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Icon Only</h4>
              <CancelButton
                onCancel={() => console.log('Cancel clicked')}
                variant="icon-only"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Cancel All</h4>
              <CancelAllButton
                onCancelAll={() => console.log('Cancel all clicked')}
                activeCount={3}
              />
            </div>
            <div className="relative h-20 bg-gray-100 dark:bg-gray-700 rounded-md">
              <h4 className="text-sm font-medium mb-2">Floating Cancel</h4>
              <FloatingCancelButton
                onCancel={() => console.log('Floating cancel clicked')}
                position="top-right"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Toast Demo */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <StatusToast
            phase="complete"
            message="Upload completed successfully!"
            fileName="demo-document.pdf"
            onHide={() => setShowToast(false)}
          />
        </div>
      )}

      {/* Clear Demo Button */}
      <div className="text-center">
        <button
          onClick={() => {
            clearProgress();
            setMessages([]);
            setDemoProgress(0);
            setDemoPhase('uploading');
          }}
          className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Clear All Demo Data
        </button>
      </div>
    </div>
  );
}
