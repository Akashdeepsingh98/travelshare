import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PostContext {
  id: string;
  location: string;
  content: string;
  image_url?: string;
  media_urls?: string[];
  media_types?: string[];
  user_name?: string;
  created_at: string;
}

interface ProfileContext {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  mini_apps_count: number;
}

interface ChatRequest {
  question: string;
  userId?: string;
  postContext?: PostContext;
  profileContext?: ProfileContext;
}

interface MCPServer {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  api_key?: string;
  is_active: boolean;
  category: string;
  capabilities: any[];
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

    const { question, userId, postContext, profileContext }: ChatRequest = await req.json()

    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Gemini API key from environment variable
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's active MCP servers if userId is provided
    let mcpServers: MCPServer[] = []
    if (userId) {
      const { data: servers, error: serversError } = await supabaseClient
        .from('mcp_servers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (!serversError && servers) {
        mcpServers = servers
      }
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
      .limit(100)

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

    // Prepare context from posts
    const postsContext = prepareTravelContext(posts || [])
    
    // Prepare post-specific context if provided
    const postSpecificContext = postContext ? preparePostContext(postContext) : null
    
    // Prepare profile-specific context if provided
    let profileSpecificContext = null
    if (profileContext) {
      profileSpecificContext = await prepareProfileContext(profileContext, supabaseClient)
    }
    
    // Prepare MCP context
    const mcpContext = await prepareMCPContext(mcpServers, question, postContext)

    // Analyze relevant images from posts (including the specific post if provided)
    const imageAnalysis = await analyzeRelevantImages(posts || [], question, apiKey, postContext, profileContext)

    // Create the prompt for Gemini
    const prompt = `You are TravelShare AI, a helpful travel assistant that provides personalized recommendations based on real traveler experiences from a travel social media platform, real-time business data through MCP servers, and visual analysis of travel photos.

${profileSpecificContext ? `PROFILE CONTEXT:
${profileSpecificContext}

` : ''}${postSpecificContext ? `SPECIFIC POST CONTEXT:
${postSpecificContext}

` : ''}CONTEXT FROM REAL TRAVELER POSTS:
${postsContext}

${mcpContext ? `REAL-TIME BUSINESS DATA (via MCP):
${mcpContext}

` : ''}${imageAnalysis ? `VISUAL ANALYSIS FROM TRAVEL PHOTOS:
${imageAnalysis}

` : ''}USER QUESTION: ${question}

Your role:
- ${profileSpecificContext ? 'Provide a comprehensive summary of the user profile based on their posts, activities, and services offered' : 'Answer travel-related questions using the provided real traveler data, MCP business data, and visual insights from photos'}
- ${postSpecificContext ? 'Pay special attention to the specific post context provided and answer questions related to that location and experience' : profileSpecificContext ? 'Highlight their travel interests, posting patterns, and any business services they offer' : 'Provide helpful, accurate, and engaging travel advice'}
- Reference specific locations and experiences from the community when relevant
- Use real-time business data from MCP servers when available (restaurants, hotels, flights, etc.)
- Incorporate visual insights from travel photos to enhance recommendations
- Be enthusiastic about travel while being informative
- If the community data is limited, supplement with general travel knowledge
- Always be helpful and encouraging about travel

Guidelines:
- ${profileSpecificContext ? 'Structure the profile summary in clear sections (e.g., Travel Style, Favorite Destinations, Services Offered)' : 'Use the real post data to provide authentic recommendations'}
- ${postSpecificContext ? 'When answering about the specific post, reference the location, content, and any visual elements from that post' : profileSpecificContext ? 'Mention specific destinations they\'ve posted about and their apparent travel preferences' : 'Leverage MCP business data for current information (menus, availability, prices, etc.)'}
- Reference visual elements from photos when relevant (architecture, landscapes, food, activities)
- Mention specific destinations that travelers have visited
- Reference popular spots based on likes and engagement
- Provide practical travel tips and advice
- Keep responses conversational and engaging
- Format responses clearly with sections when helpful
- Limit response to about 600-700 words
- When using MCP data, mention that it's real-time business information
- When referencing visual analysis, mention insights from traveler photos
- ${postSpecificContext ? 'If asked about transportation or services related to the post location, use MCP data if available' : ''}

Please provide a helpful response to the user's travel question.`

    // Initialize Gemini client and make API call
    try {
      console.log('Initializing Gemini client...')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" })

      console.log('Sending request to Gemini API...')
      const result = await model.generateContent(prompt)
      const response = await result.response
      const aiResponse = response.text()

      console.log('Successfully received response from Gemini API')
      return new Response(
        JSON.stringify({ 
          answer: aiResponse,
          postsCount: posts?.length || 0,
          mcpServersUsed: mcpServers.length,
          imagesAnalyzed: imageAnalysis ? 'Yes' : 'No',
          provider: 'gemini-mcp-vision',
          postContextUsed: postContext ? 'Yes' : 'No',
          profileContextUsed: profileContext ? 'Yes' : 'No'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (geminiError: any) {
      console.error('Gemini API error details:', {
        message: geminiError.message,
        status: geminiError.status,
        code: geminiError.code,
        details: geminiError.details,
        stack: geminiError.stack
      })
      
      let errorMessage = 'Failed to get AI response'
      let statusCode = 500

      // Check for specific error patterns
      const errorString = geminiError.message?.toLowerCase() || ''
      const errorDetails = JSON.stringify(geminiError).toLowerCase()

      if (errorString.includes('api_key_invalid') || errorString.includes('invalid api key') || 
          errorDetails.includes('api_key_invalid') || errorDetails.includes('invalid api key')) {
        errorMessage = 'Invalid Google Gemini API key'
        statusCode = 401
      } else if (errorString.includes('quota') || errorString.includes('exceeded') ||
                 errorDetails.includes('quota') || errorDetails.includes('exceeded')) {
        errorMessage = 'Google Gemini API quota exceeded'
        statusCode = 429
      } else if (errorString.includes('rate limit') || errorString.includes('too many requests') ||
                 errorDetails.includes('rate limit') || errorDetails.includes('too many requests')) {
        errorMessage = 'Google Gemini API rate limit exceeded'
        statusCode = 429
      } else if (errorString.includes('permission') || errorString.includes('forbidden') ||
                 errorDetails.includes('permission') || errorDetails.includes('forbidden')) {
        errorMessage = 'Google Gemini API permission denied - check API key permissions'
        statusCode = 403
      } else if (errorString.includes('network') || errorString.includes('connection') ||
                 errorDetails.includes('network') || errorDetails.includes('connection')) {
        errorMessage = 'Network error connecting to Google Gemini API'
        statusCode = 503
      } else {
        // Include more details for debugging
        errorMessage = `Google Gemini API error: ${geminiError.message || 'Unknown error'}`
        console.error('Unhandled Gemini error type:', geminiError)
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: geminiError.message,
          code: geminiError.code || 'UNKNOWN'
        }),
        { 
          status: statusCode, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error: any) {
    console.error('Error in AI chat function:', {
      message: error.message,
      stack: error.stack,
      details: error
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function preparePostContext(postContext: PostContext): string {
  const date = new Date(postContext.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const hasMedia = postContext.image_url || (postContext.media_urls && postContext.media_urls.length > 0)
  
  return `USER IS ASKING ABOUT THIS SPECIFIC POST:
- Location: ${postContext.location}
- Posted by: ${postContext.user_name || 'Unknown user'}
- Date: ${date}
- Contains media: ${hasMedia ? 'Yes' : 'No'}
- Post content: "${postContext.content}"

This post is the main context for the user's question. Focus your answer on this specific location and content.
If the user is asking about transportation, accommodations, or services related to this location, use MCP data if available.
If the post contains media that has been analyzed, reference visual elements from the analysis.`
}

async function prepareProfileContext(profileContext: ProfileContext, supabaseClient: any): Promise<string> {
  try {
    // Fetch user's recent posts
    const { data: userPosts, error: postsError } = await supabaseClient
      .from('posts')
      .select(`
        id,
        location,
        content,
        image_url,
        media_urls,
        media_types,
        created_at,
        likes_count
      `)
      .eq('user_id', profileContext.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (postsError) {
      console.error('Error fetching user posts for profile context:', postsError)
    }
    
    // Fetch user's mini apps
    const { data: miniApps, error: appsError } = await supabaseClient
      .from('mini_apps')
      .select('*')
      .eq('user_id', profileContext.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (appsError) {
      console.error('Error fetching mini apps for profile context:', appsError)
    }
    
    // Format the profile context
    const memberSince = new Date(profileContext.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
    
    // Extract locations from posts
    const locations = userPosts?.map(post => post.location) || []
    const uniqueLocations = [...new Set(locations)]
    
    // Get popular posts (by likes)
    const popularPosts = userPosts
      ?.filter(post => post.likes_count > 0)
      .sort((a, b) => b.likes_count - a.likes_count)
      .slice(0, 3) || []
    
    // Count posts with media
    const postsWithMedia = userPosts?.filter(post => 
      post.image_url || (post.media_urls && post.media_urls.length > 0)
    ).length || 0
    
    // Format mini apps by category
    const appsByCategory: Record<string, any[]> = {}
    miniApps?.forEach(app => {
      if (!appsByCategory[app.category]) {
        appsByCategory[app.category] = []
      }
      appsByCategory[app.category].push(app)
    })
    
    return `USER IS ASKING FOR A SUMMARY OF THIS PROFILE:
- Name: ${profileContext.name}
- Member since: ${memberSince}
- Posts: ${profileContext.posts_count}
- Followers: ${profileContext.followers_count}
- Following: ${profileContext.following_count}
- Mini Apps: ${profileContext.mini_apps_count}

${userPosts && userPosts.length > 0 ? `POSTING ACTIVITY:
- Total posts analyzed: ${userPosts.length}
- Posts with visual content: ${postsWithMedia}
- Unique destinations: ${uniqueLocations.length}
- Locations mentioned: ${uniqueLocations.slice(0, 10).join(', ')}${uniqueLocations.length > 10 ? '...' : ''}

${popularPosts.length > 0 ? `POPULAR POSTS:
${popularPosts.map((post, i) => {
  const excerpt = post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content
  return `${i + 1}. ${post.location}: "${excerpt}" (${post.likes_count} likes)`
}).join('\n')}` : ''}` : ''}

${miniApps && miniApps.length > 0 ? `SERVICES OFFERED (MINI APPS):
${Object.entries(appsByCategory).map(([category, apps]) => 
  `- ${category.charAt(0).toUpperCase() + category.slice(1)} (${apps.length}): ${apps.map(app => app.name).join(', ')}`
).join('\n')}` : ''}

Based on this information, provide a comprehensive profile summary that highlights:
1. Travel style and preferences
2. Favorite or frequently visited destinations
3. Types of content they share
4. Services they offer through mini apps (if any)
5. Overall engagement in the community

The summary should be personalized, insightful, and highlight what makes this profile unique in the travel community.`
}

function prepareTravelContext(posts: any[]): string {
  if (!posts || posts.length === 0) {
    return "No travel posts available in the community yet."
  }

  // Extract locations and organize data
  const locations = posts.map(post => post.location).filter(Boolean)
  const uniqueLocations = [...new Set(locations)]
  
  // Get popular destinations (by likes)
  const popularPosts = posts
    .filter(post => post.likes_count > 0)
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 15)

  // Get recent experiences
  const recentPosts = posts.slice(0, 20)

  // Count posts with visual content
  const postsWithImages = posts.filter(p => p.image_url || (p.media_urls && p.media_urls.length > 0))

  let context = `TRAVEL COMMUNITY DATA SUMMARY:
- Total posts analyzed: ${posts.length}
- Unique destinations: ${uniqueLocations.length}
- Posts with visual content: ${postsWithImages.length}
- Active travelers sharing experiences

DESTINATIONS MENTIONED:
${uniqueLocations.slice(0, 20).join(', ')}

POPULAR DESTINATIONS (by community engagement):
${popularPosts.map(post => `- ${post.location} (${post.likes_count} likes)`).join('\n')}

RECENT TRAVEL EXPERIENCES:
${recentPosts.map((post, i) => {
  const excerpt = post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content
  const hasVisuals = post.image_url || (post.media_urls && post.media_urls.length > 0) ? ' [📷 with photos]' : ''
  return `${i + 1}. ${post.location}: "${excerpt}" (by ${post.user?.name || 'Anonymous'})${hasVisuals}`
}).join('\n')}

VISUAL CONTENT AVAILABLE:
- Posts with photos/videos: ${postsWithImages.length}
- Visual destinations for photography enthusiasts
- Real traveler photos available for visual analysis

Use this real data to provide authentic, community-based travel recommendations.`

  return context
}

async function prepareMCPContext(mcpServers: MCPServer[], question: string, postContext?: PostContext): Promise<string | null> {
  if (!mcpServers || mcpServers.length === 0) {
    return null
  }

  let mcpData: string[] = []

  // Query all MCP servers to get their data
  for (const server of mcpServers) {
    try {
      // Determine the generic search tool name based on server category
      let toolName = 'search'
      if (server.category === 'restaurant') toolName = 'search_restaurants'
      else if (server.category === 'flight') toolName = 'search_flights'
      else if (server.category === 'taxi') toolName = 'search_transportation'
      else if (server.category === 'hotel') toolName = 'search_hotels'
      else toolName = `search_${server.category}`
      
      // Extract location from post context if available
      const location = postContext?.location || ''
      
      // Create a simple request that will return all data
      const relevantData = await queryMCPServer(server, toolName, question, location)
      if (relevantData) {
        mcpData.push(`${server.name} (${server.category}): ${relevantData}`)
      }
    } catch (error) {
      console.error(`Error querying MCP server ${server.name}:`, error)
      // Continue with other servers even if one fails
    }
  }

  if (mcpData.length === 0) {
    return `Connected MCP servers: ${mcpServers.map(s => `${s.name} (${s.category})`).join(', ')} - No specific data retrieved for this query.`
  }

  return `CONNECTED BUSINESS DATA SOURCES:
${mcpData.join('\n\n')}

This is real-time business information that can help provide current details about services, availability, and offerings.`
}

async function queryMCPServer(server: MCPServer, toolName: string, question: string, location: string): Promise<string | null> {
  try {
    console.log(`Querying MCP server: ${server.name} (${server.category}) with tool: ${toolName}`)
    
    // Create a generic MCP request that will return all data
    const mcpRequest = {
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: {
          query: question,
          location: location
        }
      }
    }

    console.log('MCP Request:', JSON.stringify(mcpRequest, null, 2))

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Only add Authorization header if API key is provided and it's not a mock server
    const isMockServer = server.endpoint.includes('mock-mcp-server') || 
                         server.endpoint.includes('mock-flight-server') || 
                         server.endpoint.includes('mock-taxi-server') || 
                         server.endpoint.includes('mock-hotel-server')
    if (!isMockServer && server.api_key?.trim()) {
      headers['Authorization'] = `Bearer ${server.api_key.trim()}`
    }

    console.log(`Sending request to: ${server.endpoint}`)
    console.log(`Headers: ${Object.keys(headers).join(', ')}`)

    const response = await fetch(server.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mcpRequest),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HTTP Error: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('MCP Response:', JSON.stringify(data, null, 2))
    
    if (data.error) {
      console.error('MCP Error:', data.error)
      throw new Error(data.error.message || 'MCP server error')
    }

    // Extract useful information from MCP response
    if (data.result?.content) {
      // Handle array of content objects
      if (Array.isArray(data.result.content)) {
        const textContent = data.result.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n')
        return textContent || null
      }
      // Handle direct content
      return data.result.content
    }

    return null

  } catch (error) {
    console.error(`Error querying MCP server ${server.name}:`, error)
    return null
  }
}

async function analyzeRelevantImages(
  posts: any[], 
  question: string, 
  apiKey: string, 
  postContext?: PostContext,
  profileContext?: ProfileContext
): Promise<string | null> {
  try {
    let relevantPosts = []
    
    // If we have a profile context, prioritize analyzing posts from that user
    if (profileContext) {
      // We need to fetch posts for this specific user
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        const { data: userPosts, error } = await supabaseClient
          .from('posts')
          .select(`
            id,
            location,
            content,
            image_url,
            media_urls,
            media_types,
            created_at,
            likes_count
          `)
          .eq('user_id', profileContext.id)
          .order('likes_count', { ascending: false })
          .limit(5)
        
        if (!error && userPosts && userPosts.length > 0) {
          // Add user name to each post
          const postsWithUser = userPosts.map(post => ({
            ...post,
            user: { name: profileContext.name }
          }))
          
          relevantPosts = postsWithUser
        }
      } catch (error) {
        console.error('Error fetching user posts for profile analysis:', error)
      }
    }
    
    // If we have a post context with media, prioritize analyzing that
    if (postContext && (postContext.image_url || (postContext.media_urls && postContext.media_urls.length > 0))) {
      // Create a post-like object from the post context
      const contextPost = {
        id: postContext.id,
        location: postContext.location,
        content: postContext.content,
        image_url: postContext.image_url,
        media_urls: postContext.media_urls,
        media_types: postContext.media_types,
        user: { name: postContext.user_name || 'Unknown' },
        likes_count: 0
      }
      
      // Add to the beginning of the array
      relevantPosts.unshift(contextPost)
    }
    
    // If we don't have enough posts yet, add more from the general posts
    if (relevantPosts.length < 5) {
      // Filter posts that have images and are relevant to the question
      const postsWithImages = posts.filter(post => {
        const hasImages = post.image_url || (post.media_urls && post.media_urls.length > 0)
        if (!hasImages) return false
        
        // Check if post is relevant to the question or the post context
        const questionLower = question.toLowerCase()
        const postText = `${post.location} ${post.content}`.toLowerCase()
        
        // If we have post context, prioritize posts from the same location
        if (postContext && post.location.toLowerCase().includes(postContext.location.toLowerCase())) {
          return true
        }
        
        // Simple relevance check - can be enhanced with more sophisticated matching
        const keywords = questionLower.split(' ').filter(word => word.length > 3)
        const isRelevant = keywords.some(keyword => postText.includes(keyword))
        
        return isRelevant
      })

      // Add other relevant posts, but limit the total
      if (postsWithImages.length > 0) {
        // Sort by relevance (likes count as a proxy for relevance)
        const sortedPosts = postsWithImages
          .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
          .slice(0, 5 - relevantPosts.length) // Only add enough to reach 5 total
        
        // Add these posts to our analysis list, avoiding duplicates
        for (const post of sortedPosts) {
          if (!relevantPosts.some(p => p.id === post.id)) {
            relevantPosts.push(post)
          }
        }
      }
    }

    // Limit to 5 posts total to avoid API limits
    relevantPosts = relevantPosts.slice(0, 5)
    
    if (relevantPosts.length === 0) {
      return null
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" })

    let imageAnalyses: string[] = []

    for (const post of relevantPosts) {
      try {
        // Get the first image URL (either from image_url or media_urls)
        let imageUrl = post.image_url
        if (!imageUrl && post.media_urls && post.media_urls.length > 0) {
          // Only analyze images, not videos
          const imageUrls = post.media_urls.filter((url: string, index: number) => {
            const mediaType = post.media_types?.[index]
            return mediaType === 'image' || !mediaType // fallback for backward compatibility
          })
          if (imageUrls.length > 0) {
            imageUrl = imageUrls[0]
          }
        }

        if (!imageUrl) continue

        // Fetch image data
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) continue

        const imageBuffer = await imageResponse.arrayBuffer()
        const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

        // Analyze the image
        const prompt = `Analyze this travel photo from ${post.location}. Describe what you see in terms of:
1. Type of destination (urban, natural, cultural, etc.)
2. Notable features, architecture, or landmarks
3. Activities or experiences visible
4. Time of day/season if apparent
5. Overall atmosphere and appeal

Keep the analysis concise and focused on travel-relevant details.

Context: "${post.content}"`

        const result = await visionModel.generateContent([
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
            }
          }
        ])

        const analysis = await result.response.text()
        
        // Mark if this is from the post context or profile context
        let postPrefix = '📍 '
        if (postContext && post.id === postContext.id) {
          postPrefix = '📌 FROM CURRENT POST - '
        } else if (profileContext && post.user?.name === profileContext.name) {
          postPrefix = `👤 FROM ${profileContext.name.toUpperCase()}'S POSTS - `
        }
        
        imageAnalyses.push(`${postPrefix}${post.location}: ${analysis}`)

      } catch (imageError) {
        console.error(`Error analyzing image for post ${post.id}:`, imageError)
        // Continue with other images
      }
    }

    if (imageAnalyses.length === 0) {
      return null
    }

    return `VISUAL INSIGHTS FROM TRAVELER PHOTOS:
${imageAnalyses.join('\n\n')}

These visual analyses are based on actual photos shared by travelers in our community, providing authentic insights into destinations and experiences.`

  } catch (error) {
    console.error('Error in image analysis:', error)
    return null
  }
}