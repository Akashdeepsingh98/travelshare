import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TestRequest {
  endpoint: string;
  apiKey?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { endpoint, apiKey }: TestRequest = await req.json()

    if (!endpoint?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Endpoint is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test MCP server connection by calling the initialize method
    const mcpRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        clientInfo: {
          name: 'TravelShare',
          version: '1.0.0'
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (apiKey?.trim()) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    console.log(`Testing MCP server at: ${endpoint}`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mcpRequest),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message || 'MCP server returned an error')
    }

    // Extract server capabilities
    const capabilities = data.result?.capabilities || {}
    const serverInfo = data.result?.serverInfo || {}

    // Get available tools
    let tools: string[] = []
    if (capabilities.tools) {
      try {
        const toolsResponse = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            method: 'tools/list',
            params: {}
          }),
          signal: AbortSignal.timeout(5000)
        })

        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json()
          if (toolsData.result?.tools) {
            tools = toolsData.result.tools.map((tool: any) => tool.name)
          }
        }
      } catch (toolsError) {
        console.log('Could not fetch tools list:', toolsError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        serverInfo: {
          name: serverInfo.name || 'Unknown',
          version: serverInfo.version || 'Unknown'
        },
        capabilities: {
          tools: !!capabilities.tools,
          resources: !!capabilities.resources,
          prompts: !!capabilities.prompts
        },
        availableTools: tools,
        protocolVersion: data.result?.protocolVersion || 'Unknown'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error testing MCP server:', error)
    
    let errorMessage = 'Failed to connect to MCP server'
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'Connection timeout - server did not respond within 10 seconds'
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Network error - could not reach the server'
    } else if (error.message.includes('CORS')) {
      errorMessage = 'CORS error - server does not allow cross-origin requests'
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorMessage = 'Authentication failed - check your API key'
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      errorMessage = 'Access forbidden - insufficient permissions'
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
      errorMessage = 'Server not found - check the endpoint URL'
    } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      errorMessage = 'Server error - the MCP server encountered an internal error'
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})