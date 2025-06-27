export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats an itinerary as plain text for sharing
 */
export function formatItineraryAsPlainText(
  itinerary: any,
  itineraryItems: any[] = []
): string {
  if (!itinerary) return '';
  
  // Format dates
  const startDate = itinerary.start_date 
    ? new Date(itinerary.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const endDate = itinerary.end_date
    ? new Date(itinerary.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  
  // Format budget
  let budgetText = '';
  if (itinerary.budget) {
    switch (itinerary.budget) {
      case 'budget':
        budgetText = 'Budget ($)';
        break;
      case 'moderate':
        budgetText = 'Moderate ($$)';
        break;
      case 'luxury':
        budgetText = 'Luxury ($$$)';
        break;
      default:
        budgetText = itinerary.budget;
    }
  }
  
  // Format preferences
  const prefMap: Record<string, string> = {
    'culture': '🏛️ Cultural',
    'nature': '🌲 Nature',
    'food': '🍽️ Food',
    'adventure': '🧗‍♀️ Adventure',
    'relaxation': '🧘‍♂️ Relaxation',
    'shopping': '🛍️ Shopping',
    'nightlife': '🌃 Nightlife',
    'family': '👨‍👩‍👧‍👦 Family',
    'budget': '💰 Budget',
    'luxury': '✨ Luxury',
    'history': '🏰 History',
    'art': '🎨 Art',
    'beach': '🏖️ Beaches',
    'mountains': '⛰️ Mountains',
    'photography': '📸 Photography'
  };
  
  const preferences = Array.isArray(itinerary.preferences) 
    ? itinerary.preferences.map(pref => prefMap[pref] || pref).join(', ')
    : '';
  
  // Group items by day
  const itemsByDay = itineraryItems.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<number, any[]>);
  
  // Sort days
  const sortedDays = Object.keys(itemsByDay).map(Number).sort((a, b) => a - b);
  
  // Format category
  const formatCategory = (category?: string): string => {
    if (!category) return '';
    
    const categoryMap: Record<string, string> = {
      'accommodation': '🏨 Accommodation',
      'activity': '🎯 Activity',
      'food': '🍽️ Food',
      'transportation': '🚗 Transport',
      'other': '📌 Other'
    };
    
    return categoryMap[category] || category;
  };
  
  // Format cost
  const formatCost = (cost?: number): string => {
    if (!cost) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(cost);
  };
  
  // Build the text
  let text = `${itinerary.title.toUpperCase()}\n`;
  text += `${itinerary.destination}\n\n`;
  
  // Add dates if available
  if (startDate && endDate) {
    text += `📅 ${startDate} - ${endDate}\n`;
  }
  
  // Add budget if available
  if (budgetText) {
    text += `💰 Budget: ${budgetText}\n`;
  }
  
  // Add preferences if available
  if (preferences) {
    text += `✨ Preferences: ${preferences}\n`;
  }
  
  // Add notes if available
  if (itinerary.notes) {
    text += `\n📝 Notes: ${itinerary.notes}\n`;
  }
  
  // Add day-by-day itinerary
  text += `\n--- ITINERARY DETAILS ---\n\n`;
  
  if (sortedDays.length === 0) {
    text += 'No itinerary items yet.\n';
  } else {
    sortedDays.forEach(day => {
      text += `DAY ${day}\n`;
      text += `${'='.repeat(30)}\n`;
      
      // Sort items by order
      const dayItems = itemsByDay[day].sort((a, b) => a.order - b.order);
      
      dayItems.forEach(item => {
        // Item title with time if available
        text += `${item.time ? `[${item.time}] ` : ''}${item.title}\n`;
        
        // Location if available
        if (item.location) {
          text += `📍 ${item.location}\n`;
        }
        
        // Category and cost if available
        const categoryText = formatCategory(item.category);
        const costText = formatCost(item.cost);
        
        if (categoryText || costText) {
          text += `${categoryText}${categoryText && costText ? ' | ' : ''}${costText}\n`;
        }
        
        // Description if available
        if (item.description) {
          text += `${item.description}\n`;
        }
        
        // Notes if available
        if (item.notes) {
          text += `Note: ${item.notes}\n`;
        }
        
        text += '\n';
      });
    });
  }
  
  // Add footer
  text += `--- Created with TravelShare ---\n`;
  
  return text;
}