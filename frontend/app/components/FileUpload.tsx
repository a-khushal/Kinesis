'use client';

import { useState, useRef } from 'react';

export function FileUpload({
    onFileSelect,
    onCancel,
    allowedFormats,
    maxFileSize = 50 * 1024 * 1024,
    disabled = false
}: {
    onFileSelect: (file: File) => void;
    onCancel?: () => void;
    allowedFormats: string[];
    maxFileSize?: number;
    disabled?: boolean;
}) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: any) => {
        if (disabled) return;

        const file = event.target.files?.[0];
        if (!file) return;

        if (!allowedFormats.includes(file.type)) {
            alert(`Only ${allowedFormats.join(', ')} files are allowed!`);
            return;
        }

        if (file.size > maxFileSize) {
            const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2);
            alert(`File is too large. Maximum file size is ${maxSizeMB}MB.`);
            return;
        }

        setSelectedFile(file);
        onFileSelect(file);
    };

    const handleCancel = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onCancel?.();
    };

    const handleSelectNewFile = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${disabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 bg-white cursor-pointer'
            }`}>
            {!selectedFile ? (
                <label className="text-center">
                    <span className="block mb-2 text-gray-700">
                        Click to select a file or drag and drop
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={allowedFormats.join(',')}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={disabled}
                    />
                    <div className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        Select File
                    </div>
                </label>
            ) : (
                <div className="w-full text-center">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md mb-3">
                        <span className="text-sm text-gray-700 truncate max-w-xs">
                            {selectedFile.name}
                        </span>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
                            disabled={disabled}
                            aria-label="Remove file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleSelectNewFile}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        disabled={disabled}
                    >
                        selected file
                    </button>
                </div>
            )}
        </div>
    );
}
