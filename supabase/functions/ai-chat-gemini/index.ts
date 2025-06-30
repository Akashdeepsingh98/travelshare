import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0'

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
    
    // Analyze relevant images from posts
    const imageAnalysis = await analyzeRelevantImages(posts || [], question, apiKey)

    // Create the prompt for Gemini
    const prompt = `You are TravelShare AI, a helpful travel assistant that provides personalized recommendations based on real traveler experiences from a travel social media platform and visual analysis of travel photos.

CONTEXT FROM REAL TRAVELER POSTS:
${postsContext}

${imageAnalysis ? `VISUAL ANALYSIS FROM TRAVEL PHOTOS:
${imageAnalysis}

` : ''}USER QUESTION: ${question}

Your role:
- Answer travel-related questions using the provided real traveler data and visual insights from photos
- Provide helpful, accurate, and engaging travel advice
- Reference specific locations and experiences from the community when relevant
- Incorporate visual insights from travel photos to enhance recommendations
- Be enthusiastic about travel while being informative
- If the community data is limited, supplement with general travel knowledge
- Always be helpful and encouraging about travel

Guidelines:
- Use the real post data to provide authentic recommendations
- Reference visual elements from photos when relevant (architecture, landscapes, food, activities)
- Mention specific destinations that travelers have visited
- Reference popular spots based on likes and engagement
- Provide practical travel tips and advice
- Keep responses conversational and engaging
- Format responses clearly with sections when helpful
- Limit response to about 500-600 words
- When referencing visual analysis, mention insights from traveler photos

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
          imagesAnalyzed: imageAnalysis ? 'Yes' : 'No',
          provider: 'gemini-vision'
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

async function analyzeRelevantImages(posts: any[], question: string, apiKey: string): Promise<string | null> {
  try {
    // Filter posts that have images and are relevant to the question
    const postsWithImages = posts.filter(post => {
      const hasImages = post.image_url || (post.media_urls && post.media_urls.length > 0)
      if (!hasImages) return false
      
      // Check if post is relevant to the question
      const questionLower = question.toLowerCase()
      const postText = `${post.location} ${post.content}`.toLowerCase()
      
      // Simple relevance check - can be enhanced with more sophisticated matching
      const keywords = questionLower.split(' ').filter(word => word.length > 3)
      const isRelevant = keywords.some(keyword => postText.includes(keyword))
      
      return isRelevant
    })

    if (postsWithImages.length === 0) {
      return null
    }

    // Limit to top 5 most relevant posts to avoid API limits
    const relevantPosts = postsWithImages
      .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      .slice(0, 5)

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
        imageAnalyses.push(`📍 ${post.location}: ${analysis}`)

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