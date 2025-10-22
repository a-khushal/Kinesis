'use client';

export function FileUpload({ onFileSelect, allowedFormats, disabled = false }: {
    onFileSelect: (file: File) => void;
    allowedFormats: string[];
    disabled?: boolean;
}) {
    const handleFileChange = (event: any) => {
        if (disabled) return;

        const file = event.target.files?.[0];
        if (!file) return;

        if (!allowedFormats.includes(file.type)) {
            alert(`Only ${allowedFormats.join(', ')} files are allowed!`);
            return;
        }

        onFileSelect(file);
    };

    return (
        <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${disabled
                ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                : 'border-gray-300 hover:border-blue-400 bg-white cursor-pointer'
            }`}>
            <label className={`text-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className={`block mb-2 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                    {disabled ? 'Upload in progress...' : 'Click to select a file or drag and drop'}
                </span>
                <input
                    type="file"
                    accept={allowedFormats.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />
                <div className={`px-4 py-2 rounded-md transition-colors ${disabled
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}>
                    {disabled ? 'Uploading...' : 'Select File'}
                </div>
            </label>
            <p className={`mt-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                Supported formats: {allowedFormats.join(', ')}
            </p>
        </div>
    );
}
