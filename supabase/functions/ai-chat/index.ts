import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  question: string;
  userId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { question, userId }: ChatRequest = await req.json()

    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get recent posts data to provide context
    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select(`
        id,
        location,
        content,
        image_url,
        media_urls,
        media_types,
        created_at,
        likes_count,
        user:profiles!posts_user_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch posts data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate a contextual response based on the question and posts data
    const response = generateTravelResponse(question, posts || [])

    return new Response(
      JSON.stringify({ 
        answer: response,
        postsCount: posts?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in AI chat function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateTravelResponse(question: string, posts: any[]): string {
  const lowerQuestion = question.toLowerCase()
  
  // Extract locations from posts
  const locations = posts.map(post => post.location).filter(Boolean)
  const uniqueLocations = [...new Set(locations)]
  
  // Get popular destinations (by likes)
  const popularPosts = posts
    .filter(post => post.likes_count > 0)
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 10)
  
  // Question type detection and response generation
  if (lowerQuestion.includes('popular') && (lowerQuestion.includes('destination') || lowerQuestion.includes('place'))) {
    if (uniqueLocations.length === 0) {
      return "I don't have enough travel data yet to recommend popular destinations. Check back as more travelers share their experiences!"
    }
    
    const topLocations = uniqueLocations.slice(0, 5)
    return `Based on recent traveler posts, here are some popular destinations:\n\n${topLocations.map((loc, i) => `${i + 1}. ${loc}`).join('\n')}\n\nThese locations have been featured in recent travel posts from our community. Each destination offers unique experiences shared by fellow travelers!`
  }
  
  if (lowerQuestion.includes('japan')) {
    const japanPosts = posts.filter(post => 
      post.location?.toLowerCase().includes('japan') || 
      post.content?.toLowerCase().includes('japan')
    )
    
    if (japanPosts.length === 0) {
      return "I haven't found specific Japan travel experiences in our recent posts, but Japan is an amazing destination! Consider sharing your own Japan travel experiences to help other travelers."
    }
    
    const japanLocations = japanPosts.map(post => post.location).filter(Boolean)
    return `Here's what travelers have shared about Japan:\n\n${japanLocations.length > 0 ? `Visited locations: ${japanLocations.join(', ')}\n\n` : ''}Based on ${japanPosts.length} recent post${japanPosts.length === 1 ? '' : 's'}, travelers have been exploring Japan and sharing their experiences. Japan offers incredible cultural experiences, delicious food, and beautiful landscapes!`
  }
  
  if (lowerQuestion.includes('hidden gem') || lowerQuestion.includes('secret')) {
    const lesserKnownPlaces = uniqueLocations.filter(location => {
      const postCount = posts.filter(post => post.location === location).length
      return postCount <= 2 // Places mentioned in 2 or fewer posts
    }).slice(0, 3)
    
    if (lesserKnownPlaces.length === 0) {
      return "Every destination can be a hidden gem depending on how you explore it! Check out the less popular posts in our community - they might reveal some amazing lesser-known spots."
    }
    
    return `Here are some potential hidden gems from our community:\n\n${lesserKnownPlaces.map((loc, i) => `${i + 1}. ${loc}`).join('\n')}\n\nThese destinations have been mentioned by fewer travelers, which might make them perfect for those seeking unique experiences off the beaten path!`
  }
  
  if (lowerQuestion.includes('photography') || lowerQuestion.includes('photo')) {
    const postsWithMedia = posts.filter(post => 
      post.image_url || (post.media_urls && post.media_urls.length > 0)
    )
    
    if (postsWithMedia.length === 0) {
      return "I don't see many posts with photos right now, but every destination offers great photography opportunities! Encourage travelers to share more photos of their adventures."
    }
    
    const photoLocations = postsWithMedia.map(post => post.location).filter(Boolean).slice(0, 5)
    return `Great photography spots based on posts with images:\n\n${photoLocations.map((loc, i) => `${i + 1}. ${loc}`).join('\n')}\n\nThese locations have been featured in posts with photos, suggesting they offer great visual experiences for photography enthusiasts!`
  }
  
  if (lowerQuestion.includes('europe')) {
    const europeanCountries = ['france', 'italy', 'spain', 'germany', 'uk', 'england', 'scotland', 'ireland', 'netherlands', 'belgium', 'switzerland', 'austria', 'portugal', 'greece', 'norway', 'sweden', 'denmark']
    const europePosts = posts.filter(post => 
      europeanCountries.some(country => 
        post.location?.toLowerCase().includes(country) || 
        post.content?.toLowerCase().includes(country)
      )
    )
    
    if (europePosts.length === 0) {
      return "Europe offers incredible diversity! From the romantic cities of France and Italy to the stunning fjords of Norway and the historic charm of the UK. Each country has its own unique culture, cuisine, and attractions. Consider researching visa requirements, transportation options like Eurail passes, and the best times to visit different regions."
    }
    
    const europeLocations = europePosts.map(post => post.location).filter(Boolean)
    return `Based on traveler experiences in Europe:\n\n${europeLocations.length > 0 ? `Recent destinations: ${europeLocations.join(', ')}\n\n` : ''}Europe offers amazing diversity in culture, food, and landscapes. Key tips: research transportation passes, check visa requirements, and consider the season for your visit. Each European country offers unique experiences!`
  }
  
  // Generic travel advice
  if (lowerQuestion.includes('tip') || lowerQuestion.includes('advice')) {
    return `Here are some general travel tips based on our community:\n\n• Research your destination beforehand\n• Pack light and bring essentials\n• Try local food and experiences\n• Respect local customs and culture\n• Take photos but also enjoy the moment\n• Connect with other travelers\n• Stay flexible with your plans\n\nOur travel community has shared ${posts.length} recent experiences across ${uniqueLocations.length} different locations!`
  }
  
  // Default response with current data
  if (posts.length === 0) {
    return "Welcome to TravelShare AI! I help answer travel questions based on real experiences from our community. Right now, I'm waiting for more travelers to share their adventures. Feel free to ask me about travel destinations, tips, or experiences!"
  }
  
  return `Thanks for your question! Based on our community's recent travel experiences, we have posts from ${uniqueLocations.length} different locations including ${uniqueLocations.slice(0, 3).join(', ')}${uniqueLocations.length > 3 ? ' and more' : ''}.\n\nFeel free to ask me about:\n• Popular destinations\n• Specific countries or cities\n• Travel tips and advice\n• Photography spots\n• Hidden gems\n\nI'll do my best to help based on real traveler experiences in our community!`
}