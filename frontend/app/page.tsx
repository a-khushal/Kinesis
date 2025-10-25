'use client';

import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { getPresignedUrl } from '../hooks/useFileUpload';
import { useAddDbEntry } from '@/hooks/useAddDbEntry';

export default function Home() {
  const allowedVideoFormats = ['video/mp4', 'video/webm', 'video/ogg'];
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      const { url: presignedUrl, videoId, s3InputKey } = await getPresignedUrl(file);
      console.log(presignedUrl)

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        console.error('Error uploading file:', await response.text());
        return;
      }

      const res = await useAddDbEntry({ videoId, s3InputKey, originalFileName: file.name, contentType: file.type });
      console.log(res);
      if (response.ok && res.success) {
        alert('File uploaded successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading file');
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
              Uploading...
            </p>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Supported formats: {allowedVideoFormats.join(', ')}</p>
          <p className="mt-1">Max file size: 50MB</p>
        </div>
      </div>
    </div>
  );
}
