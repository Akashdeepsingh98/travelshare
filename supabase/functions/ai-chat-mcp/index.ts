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
    
    // Prepare MCP context
    const mcpContext = await prepareMCPContext(mcpServers, question)

    // Create the prompt for Gemini
    const prompt = `You are TravelShare AI, a helpful travel assistant that provides personalized recommendations based on real traveler experiences from a travel social media platform and real-time business data through MCP servers.

CONTEXT FROM REAL TRAVELER POSTS:
${postsContext}

${mcpContext ? `REAL-TIME BUSINESS DATA (via MCP):
${mcpContext}

` : ''}USER QUESTION: ${question}

Your role:
- Answer travel-related questions using the provided real traveler data and MCP business data
- Provide helpful, accurate, and engaging travel advice
- Reference specific locations and experiences from the community when relevant
- Use real-time business data from MCP servers when available (restaurants, hotels, flights, etc.)
- Be enthusiastic about travel while being informative
- If the community data is limited, supplement with general travel knowledge
- Always be helpful and encouraging about travel

Guidelines:
- Use the real post data to provide authentic recommendations
- Leverage MCP business data for current information (menus, availability, prices, etc.)
- Mention specific destinations that travelers have visited
- Reference popular spots based on likes and engagement
- Provide practical travel tips and advice
- Keep responses conversational and engaging
- Format responses clearly with sections when helpful
- Limit response to about 500-600 words
- When using MCP data, mention that it's real-time business information

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
          provider: 'gemini-mcp'
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

async function prepareMCPContext(mcpServers: MCPServer[], question: string): Promise<string | null> {
  if (!mcpServers || mcpServers.length === 0) {
    return null
  }

  let mcpData: string[] = []

  // Query relevant MCP servers based on question content
  for (const server of mcpServers) {
    try {
      const relevantData = await queryMCPServer(server, question)
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

async function queryMCPServer(server: MCPServer, question: string): Promise<string | null> {
  try {
    // Create MCP request based on question content and server capabilities
    const mcpRequest = {
      method: 'tools/call',
      params: {
        name: 'search',
        arguments: {
          query: question,
          category: server.category
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (server.api_key) {
      headers['Authorization'] = `Bearer ${server.api_key}`
    }

    const response = await fetch(server.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mcpRequest)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message || 'MCP server error')
    }

    // Extract useful information from MCP response
    if (data.result && data.result.content) {
      return data.result.content
    }

    return null

  } catch (error) {
    console.error(`Error querying MCP server ${server.name}:`, error)
    return null
  }
}