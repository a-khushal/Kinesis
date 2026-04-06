'use client';

import { useRef, useState, type ChangeEvent } from 'react';

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

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
        <div className={`rounded-lg border p-4 transition-colors ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100' : 'border-slate-300 bg-white'
            }`}>
            {!selectedFile ? (
                <label className="block cursor-pointer text-center">
                    <span className="block text-sm text-slate-600">Select a video file to upload</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={allowedFormats.join(',')}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={disabled}
                    />
                    <div className="mt-3 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                        Select File
                    </div>
                </label>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
                        <span className="max-w-xs truncate text-sm text-slate-700">
                            {selectedFile.name}
                        </span>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="ml-3 rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white"
                            disabled={disabled}
                            aria-label="Remove file"
                        >
                            Remove
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleSelectNewFile}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        disabled={disabled}
                    >
                        Select Another File
                    </button>
                </div>
            )}
        </div>
    );
}
