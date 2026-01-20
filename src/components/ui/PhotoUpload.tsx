'use client';

import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  challengeId: string;
  entryDate: string;
  disabled?: boolean;
}

export function PhotoUpload({ value, onChange, challengeId, entryDate, disabled }: PhotoUploadProps) {
  const [uploadingFrom, setUploadingFrom] = useState<'camera' | 'gallery' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') => {
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
    setUploadingFrom(source);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${challengeId}/${entryDate}/${user.id}_${Date.now()}.${ext}`;

      console.log('[PhotoUpload] Uploading to:', filename);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('challenge-photos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('[PhotoUpload] Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('challenge-photos')
        .getPublicUrl(filename);

      console.log('[PhotoUpload] Success, URL:', publicUrl);
      onChange(publicUrl);
    } catch (err: unknown) {
      console.error('[PhotoUpload] Failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      // Check for common issues
      if (message.includes('Bucket not found') || message.includes('bucket')) {
        setError('Storage not configured. Create "challenge-photos" bucket in Supabase.');
      } else if (message.includes('policy') || message.includes('permission')) {
        setError('Storage permissions not configured.');
      } else {
        setError(`Upload failed: ${message}`);
      }
    } finally {
      setUploadingFrom(null);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  if (value) {
    return (
      <div className="relative">
        <img
          src={value}
          alt="Daily photo"
          className="w-full h-48 object-cover rounded-xl"
        />
        {!disabled && (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'gallery')}
        className="hidden"
        disabled={disabled || !!uploadingFrom}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e, 'camera')}
        className="hidden"
        disabled={disabled || !!uploadingFrom}
      />

      {/* Upload buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || !!uploadingFrom}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
        >
          {uploadingFrom === 'camera' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">Take Photo</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || !!uploadingFrom}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
        >
          {uploadingFrom === 'gallery' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">Gallery</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
