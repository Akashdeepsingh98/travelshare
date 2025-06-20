export const APP_CONFIG = {
  name: 'TravelShare',
  version: '1.0.0',
  description: 'Share Your Travel Adventures',
  maxFileSize: 10, // MB
  maxMediaFiles: 10,
  maxTextPostWords: 300, // Maximum words for text-only posts
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
  supportedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
  defaultAvatarUrl: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
};

export const MINI_APP_CATEGORIES = [
  { value: 'transportation', label: '🚗 Transportation', icon: '🚗' },
  { value: 'food', label: '🍽️ Food & Dining', icon: '🍽️' },
  { value: 'shopping', label: '🛍️ Shopping', icon: '🛍️' },
  { value: 'entertainment', label: '🎬 Entertainment', icon: '🎬' },
  { value: 'travel', label: '✈️ Travel & Tourism', icon: '✈️' },
  { value: 'business', label: '💼 Business Services', icon: '💼' },
  { value: 'other', label: '📋 Other', icon: '📋' }
];

export const MCP_CATEGORIES = [
  { value: 'restaurant', label: '🍽️ Restaurant', icon: '🍽️' },
  { value: 'hotel', label: '🏨 Hotel', icon: '🏨' },
  { value: 'flight', label: '✈️ Flight', icon: '✈️' },
  { value: 'taxi', label: '🚗 Taxi/Transportation', icon: '🚗' },
  { value: 'mall', label: '🏪 Mall/Shopping', icon: '🏪' },
  { value: 'attraction', label: '🎢 Attraction/Entertainment', icon: '🎢' },
  { value: 'general', label: '📋 General', icon: '📋' }
];

export const SEARCH_SUGGESTIONS = [
  { query: '#travel', label: '#travel' },
  { query: '#adventure', label: '#adventure' },
  { query: '#foodie', label: '#foodie' },
  { query: '#photography', label: '#photography' },
  { query: 'Japan', label: 'Japan' },
  { query: 'Europe', label: 'Europe' },
  { query: 'beach', label: 'Beach' },
  { query: 'mountains', label: 'Mountains' }
];

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size must be less than ${APP_CONFIG.maxFileSize}MB`,
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file format.',
  REQUIRED_FIELD: 'This field is required.',
  WORD_LIMIT_EXCEEDED: `Text posts cannot exceed ${APP_CONFIG.maxTextPostWords} words`
};