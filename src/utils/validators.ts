import { APP_CONFIG } from './constants';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  return { isValid: true };
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

export function validateMediaFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allSupportedTypes = [...APP_CONFIG.supportedImageTypes, ...APP_CONFIG.supportedVideoTypes];
  if (!allSupportedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Unsupported file type: ${file.type}. Supported formats: JPG, PNG, GIF, WebP, HEIC, MP4, WebM, OGG` 
    };
  }
  
  // Check file size
  const maxSizeInBytes = APP_CONFIG.maxFileSize * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return { 
      isValid: false, 
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: ${APP_CONFIG.maxFileSize}MB` 
    };
  }
  
  return { isValid: true };
}

export function getFileTypeFromExtension(filename: string): 'image' | 'video' | 'unknown' {
  const extension = filename.toLowerCase().split('.').pop() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
  
  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  }
  
  return 'unknown';
}