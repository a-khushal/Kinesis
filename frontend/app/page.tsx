'use client';

import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { getPresignedUrl } from '../hooks/useFileUpload';
import { useAddDbEntry } from '@/hooks/useAddDbEntry';

type DownloadLink = {
  resolution: string;
  outputFileName: string;
  url: string;
};

const PROCESSING_POLL_INTERVAL_MS = 5000;
const PROCESSING_MAX_POLLS = 36;

async function waitForDownloadLinks(videoId: string): Promise<DownloadLink[]> {
  for (let attempt = 0; attempt < PROCESSING_MAX_POLLS; attempt++) {
    const response = await fetch(`http://localhost:8000/api/v1/videos/${videoId}/downloads`);

    if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_POLL_INTERVAL_MS));
      continue;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch download links: ${error}`);
    }

    const data = await response.json();
    return data.downloads as DownloadLink[];
  }

  throw new Error('Video processing took too long. Try checking again in a few minutes.');
}

export default function Home() {
  const allowedVideoFormats = ['video/mp4', 'video/webm', 'video/ogg'];
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setStatusMessage('Uploading file...');
      setDownloadLinks([]);

      const { url: presignedUrl, videoId, s3InputKey } = await getPresignedUrl(file);

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        console.error('Error uploading file:', await response.text());
        setStatusMessage('Upload failed. Please try again.');
        return;
      }

      const res = await useAddDbEntry({ videoId, s3InputKey, originalFileName: file.name, contentType: file.type });
      if (response.ok && res.success) {
        setStatusMessage('Upload completed. Processing video...');
        const links = await waitForDownloadLinks(videoId);
        setDownloadLinks(links);
        setStatusMessage('Video processed successfully. Download links expire in 1 hour.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage('Error processing video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Upload Video</h1>
          <p className="text-sm text-slate-500">Your processed files are available for 1 hour.</p>
        </div>

        <div className="space-y-4">
          <FileUpload
            onFileSelect={handleFileSelect}
            allowedFormats={allowedVideoFormats}
            disabled={isLoading}
          />

          {isLoading && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-700">
              {statusMessage}
            </p>
          )}

          {!isLoading && statusMessage && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-700">
              {statusMessage}
            </p>
          )}

          {downloadLinks.length > 0 && (
            <div className="space-y-2">
              {downloadLinks.map((link) => (
                <a
                  key={link.outputFileName}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100"
                >
                  <span>Download {link.resolution}p</span>
                  <span>Open</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
          <p>Supported formats: {allowedVideoFormats.join(', ')}</p>
          <p className="mt-1">Max file size: 50MB</p>
        </div>
      </div>
    </div>
  );
}
