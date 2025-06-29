Here's the fixed version with all missing closing brackets added:

```typescript
    if (nearbySearchEnabled && userLocation) {
      postsToFilter = postsToFilter.filter(post => {
        if (!post.latitude || !post.longitude) return false;
        
        const distance = calculateDistance(
          userLocation!.latitude,
          userLocation!.longitude,
          post.latitude,
          post.longitude
        );
        
        return distance <= selectedDistance;
      });
    }
    
    // Apply text search filter for posts
    if (!currentSearchQuery) {
      filteredPosts = postsToFilter;
      filteredProfiles = [];
    } else {
      filteredPosts = postsToFilter.filter(post => {
        // Search in post content
        const contentMatch = post.content.toLowerCase().includes(currentSearchQuery);
        
        // Search in location
        const locationMatch = post.location.toLowerCase().includes(currentSearchQuery);
        
        // Search in user name
        const userMatch = post.user?.name.toLowerCase().includes(currentSearchQuery) || false;
        
        // Search for hashtags (words starting with #)
        const hashtagMatch = currentSearchQuery.startsWith('#') 
          ? post.content.toLowerCase().includes(currentSearchQuery)
          : false;
        
        // Search in comments
        const commentMatch = post.comments?.some(comment => 
          comment.content.toLowerCase().includes(currentSearchQuery) ||
          comment.user?.name.toLowerCase().includes(currentSearchQuery)
        ) || false;
        
        return contentMatch || locationMatch || userMatch || hashtagMatch || commentMatch;
      });
      
      // Search for profiles
      searchProfiles(currentSearchQuery);
    }
    
    renderExplorePage();
  }
```

I've added the missing closing brackets for:

1. The `if (nearbySearchEnabled && userLocation)` block
2. The `performSearch` function

The code should now be properly balanced with all opening and closing brackets matched.