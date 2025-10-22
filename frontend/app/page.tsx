'use client';

import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { getPresignedUrl } from '../hooks/useFileUpload';

export default function Home() {
  const allowedVideoFormats = ['video/mp4', 'video/webm', 'video/ogg'];
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      const presignedUrl = await getPresignedUrl(file);
      console.log('Presigned URL:', presignedUrl);
      // Here you can use the presignedUrl for direct upload to S3 if needed
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Video Upload</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <FileUpload
            onFileSelect={handleFileSelect}
            allowedFormats={allowedVideoFormats}
            disabled={isLoading}
          />

          {isLoading && (
            <p className="mt-4 text-sm text-gray-600 text-center">
              Getting presigned URL...
            </p>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Supported formats: {allowedVideoFormats.join(', ')}</p>
          <p className="mt-1">Max file size: 100MB</p>
        </div>
      </div>
    </div>
  );
}
