import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  question: string;
  userId?: string;
  apiKey: string;
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

    const { question, userId, apiKey }: ChatRequest = await req.json()

    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!apiKey?.trim()) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    })

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

    // Create the prompt for OpenAI
    const systemPrompt = `You are TravelShare AI, a helpful travel assistant that provides personalized recommendations based on real traveler experiences from a travel social media platform.

CONTEXT FROM REAL TRAVELER POSTS:
${postsContext}

Your role:
- Answer travel-related questions using the provided real traveler data
- Provide helpful, accurate, and engaging travel advice
- Reference specific locations and experiences from the community when relevant
- Be enthusiastic about travel while being informative
- If the community data is limited, supplement with general travel knowledge
- Always be helpful and encouraging about travel

Guidelines:
- Use the real post data to provide authentic recommendations
- Mention specific destinations that travelers have visited
- Reference popular spots based on likes and engagement
- Provide practical travel tips and advice
- Keep responses conversational and engaging
- Format responses with bullet points and sections when helpful`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_tokens: 800,
        temperature: 0.7,
      })

      const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again."

      return new Response(
        JSON.stringify({ 
          answer: aiResponse,
          postsCount: posts?.length || 0,
          provider: 'openai'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      let errorMessage = 'Failed to get AI response'
      if (openaiError.status === 401) {
        errorMessage = 'Invalid OpenAI API key'
      } else if (openaiError.status === 429) {
        errorMessage = 'OpenAI API rate limit exceeded'
      } else if (openaiError.status === 402) {
        errorMessage = 'OpenAI API quota exceeded'
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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

  let context = `TRAVEL COMMUNITY DATA SUMMARY:
- Total posts analyzed: ${posts.length}
- Unique destinations: ${uniqueLocations.length}
- Active travelers sharing experiences

DESTINATIONS MENTIONED:
${uniqueLocations.slice(0, 20).join(', ')}

POPULAR DESTINATIONS (by community engagement):
${popularPosts.map(post => `- ${post.location} (${post.likes_count} likes)`).join('\n')}

RECENT TRAVEL EXPERIENCES:
${recentPosts.map((post, i) => {
  const excerpt = post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content
  return `${i + 1}. ${post.location}: "${excerpt}" (by ${post.user?.name || 'Anonymous'})`
}).join('\n')}

MEDIA CONTENT:
- Posts with photos/videos: ${posts.filter(p => p.image_url || (p.media_urls && p.media_urls.length > 0)).length}
- Visual destinations for photography enthusiasts

Use this real data to provide authentic, community-based travel recommendations.`

  return context
}