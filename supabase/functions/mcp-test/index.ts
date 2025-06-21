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

    console.log(`Testing MCP server at: ${endpoint}`)
    console.log(`API Key provided: ${apiKey ? 'Yes' : 'No'}`)

    // Check if this is any of our mock servers
    const isMockServer = endpoint.includes('mock-mcp-server') || 
                         endpoint.includes('mock-flight-server') || 
                         endpoint.includes('mock-taxi-server') || 
                         endpoint.includes('mock-hotel-server')
    console.log(`Is mock server: ${isMockServer}`)

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

    // For mock server, do NOT add Authorization header even if API key is provided
    if (!isMockServer && apiKey?.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`
      console.log('Added Authorization header for real server')
    } else if (isMockServer) {
      console.log('Mock server detected - skipping authentication')
    } else {
      console.log('No API key provided, testing without authentication')
    }

    console.log('Sending request with headers:', Object.keys(headers))

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mcpRequest),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    console.log(`Response status: ${response.status}`)
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HTTP Error: ${response.status} - ${errorText}`)
      
      // Special handling for mock server
      if (isMockServer && response.status === 401) {
        throw new Error(`Mock server authentication error - this should not happen. The mock server is configured incorrectly.`)
      }
      
      // Special handling for authentication errors
      if (response.status === 401) {
        if (isMockServer) {
          throw new Error(`Authentication failed on mock server - ensure no API key is provided`)
        } else {
          throw new Error(`Authentication failed (HTTP 401). Please check your API key.`)
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))
    
    if (data.error) {
      console.error('MCP Error:', data.error)
      throw new Error(data.error.message || 'MCP server returned an error')
    }

    // Extract server capabilities
    const capabilities = data.result?.capabilities || {}
    const serverInfo = data.result?.serverInfo || {}

    console.log('Server capabilities:', capabilities)
    console.log('Server info:', serverInfo)

    // Get available tools
    let tools: string[] = []
    if (capabilities.tools) {
      try {
        console.log('Fetching tools list...')
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
          console.log('Tools response:', JSON.stringify(toolsData, null, 2))
          if (toolsData.result?.tools) {
            tools = toolsData.result.tools.map((tool: any) => tool.name)
            console.log('Available tools:', tools)
          }
        } else {
          console.log('Could not fetch tools list - HTTP', toolsResponse.status)
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
          version: serverInfo.version || 'Unknown',
          description: serverInfo.description || ''
        },
        capabilities: {
          tools: !!capabilities.tools,
          resources: !!capabilities.resources,
          prompts: !!capabilities.prompts
        },
        availableTools: tools,
        protocolVersion: data.result?.protocolVersion || 'Unknown',
        isMockServer: isMockServer
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
    } else if (error.message.includes('Mock server authentication error')) {
      errorMessage = 'Mock server configuration error - please report this issue'
    } else if (error.message.includes('Authentication failed') || error.message.includes('401')) {
      errorMessage = 'Authentication failed - check your API key (for mock servers, leave API key empty)'
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      errorMessage = 'Access forbidden - insufficient permissions'
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
      errorMessage = 'Server not found - check the endpoint URL'
    } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      errorMessage = 'Server error - the MCP server encountered an internal error'
    } else if (error.message) {
      errorMessage = error.message
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