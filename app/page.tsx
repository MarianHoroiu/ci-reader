'use client';

import Link from 'next/link';

export default function HomePage() {
  const handleOpenDocumentsFolder = async () => {
    try {
      const response = await fetch('/api/open-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderPath: '/Users/mario/Desktop/CI-Reader/Documents',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error opening Documents folder:\n${result.error}`);
      }
    } catch (error) {
      console.error('Error opening Documents folder:', error);
      alert(`Error opening Documents folder:\n${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ID</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Romanian ID Processing PWA
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
            Process Romanian IDs
            <span className="block text-primary-600">Fast & Accurate</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Extract personal data from Romanian Identity Cards using advanced
            AI. Upload your document and get structured data in seconds.
          </p>
          <div className="mt-10 flex flex-col items-center space-y-4">
            <Link
              href="/file-upload"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Process Romanian ID
              <svg
                className="ml-2 -mr-1 w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                href="/stored-persons"
                className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-[180px] justify-center"
              >
                <svg
                  className="mr-2 -ml-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Stored Persons
              </Link>

              <Link
                href="/fill-documents"
                className="inline-flex items-center px-6 py-3 border border-emerald-600 text-base font-medium rounded-lg text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-[180px] justify-center"
              >
                <svg
                  className="mr-2 -ml-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                Fill Documents
              </Link>

              <button
                onClick={handleOpenDocumentsFolder}
                className="inline-flex items-center px-6 py-3 border border-orange-600 text-base font-medium rounded-lg text-orange-600 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-[180px] justify-center"
              >
                <svg
                  className="mr-2 -ml-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                Documents Folder
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ID</span>
              </div>
              <span className="text-xl font-semibold">
                Romanian ID Processing PWA
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              Privacy-focused document processing for Romanian Identity Cards
            </p>
            <p className="text-sm text-gray-500">
              Built with Next.js 15, React 19, and modern PWA technologies
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
