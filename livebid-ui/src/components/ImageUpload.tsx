'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    onUploadComplete: (key: string, url: string) => void;
    currentImageUrl?: string | null;
}

export default function ImageUpload({ onUploadComplete, currentImageUrl }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setError(null);
        setIsUploading(true);

        try {
            // 1. Get pre-signed URL from backend
            const { data } = await api.post<{ uploadUrl: string; key: string; viewUrl: string }>('/images/upload-url', {
                filename: file.name,
                contentType: file.type,
            });

            // 2. Upload directly to S3 using pre-signed URL
            await fetch(data.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            // 3. Set preview and notify parent
            setPreview(data.viewUrl);
            onUploadComplete(data.key, data.viewUrl);
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUploadComplete('', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Auction Image</label>

            {preview ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    <img
                        src={preview}
                        alt="Auction preview"
                        className="w-full h-48 object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isUploading
                            ? 'border-violet-400 bg-violet-50'
                            : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50/50'
                        }`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 text-violet-600 animate-spin mb-2" />
                            <p className="text-sm text-slate-600">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mb-3">
                                <Upload className="h-6 w-6 text-violet-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-700">
                                Drop an image here or click to browse
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
