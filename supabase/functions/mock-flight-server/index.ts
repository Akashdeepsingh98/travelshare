import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface MCPRequest {
  method: string;
  params?: any;
}

// Mock flight data that complements the restaurant locations
const mockFlights = [
  {
    id: 'flight-1',
    airline: 'SkyConnect Airways',
    flightNumber: 'SC101',
    from: 'New York (JFK)',
    to: 'London (LHR)',
    departure: '2024-01-20 14:30',
    arrival: '2024-01-21 02:45',
    duration: '7h 15m',
    price: '$650',
    class: 'Economy',
    availability: 'Available',
    aircraft: 'Boeing 777-300ER',
    stops: 'Non-stop'
  },
  {
    id: 'flight-2',
    airline: 'Global Wings',
    flightNumber: 'GW205',
    from: 'London (LHR)',
    to: 'Paris (CDG)',
    departure: '2024-01-21 09:15',
    arrival: '2024-01-21 11:30',
    duration: '1h 15m',
    price: '$180',
    class: 'Economy',
    availability: 'Available',
    aircraft: 'Airbus A320',
    stops: 'Non-stop'
  },
  {
    id: 'flight-3',
    airline: 'Pacific Express',
    flightNumber: 'PE888',
    from: 'New York (JFK)',
    to: 'Tokyo (NRT)',
    departure: '2024-01-22 16:00',
    arrival: '2024-01-23 19:30',
    duration: '14h 30m',
    price: '$1,200',
    class: 'Economy',
    availability: 'Limited',
    aircraft: 'Boeing 787-9',
    stops: 'Non-stop'
  },
  {
    id: 'flight-4',
    airline: 'Mediterranean Air',
    flightNumber: 'MA442',
    from: 'Paris (CDG)',
    to: 'Rome (FCO)',
    departure: '2024-01-21 13:45',
    arrival: '2024-01-21 15:55',
    duration: '2h 10m',
    price: '$220',
    class: 'Economy',
    availability: 'Available',
    aircraft: 'Airbus A319',
    stops: 'Non-stop'
  },
  {
    id: 'flight-5',
    airline: 'Euro Connect',
    flightNumber: 'EC156',
    from: 'London (LHR)',
    to: 'Rome (FCO)',
    departure: '2024-01-21 11:20',
    arrival: '2024-01-21 15:10',
    duration: '2h 50m',
    price: '$280',
    class: 'Economy',
    availability: 'Available',
    aircraft: 'Boeing 737-800',
    stops: 'Non-stop'
  },
  {
    id: 'flight-6',
    airline: 'TransAtlantic',
    flightNumber: 'TA301',
    from: 'New York (JFK)',
    to: 'Paris (CDG)',
    departure: '2024-01-20 22:15',
    arrival: '2024-01-21 11:30',
    duration: '7h 15m',
    price: '$720',
    class: 'Economy',
    availability: 'Available',
    aircraft: 'Airbus A330-300',
    stops: 'Non-stop'
  }
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Mock Flight MCP Server - Request received:', req.method, req.url)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    // IMPORTANT: This is a mock server - it does NOT require authentication
    // We completely ignore any Authorization headers and process all requests

    let mcpRequest: MCPRequest;
    
    try {
      const body = await req.text();
      console.log('Request body:', body);
      
      if (!body.trim()) {
        // Empty body - return a simple success response
        return new Response(
          JSON.stringify({
            result: {
              message: 'Mock Flight MCP Server is running',
              status: 'ok',
              note: 'This server provides flight information for travel planning'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      mcpRequest = JSON.parse(body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          error: {
            code: -1,
            message: 'Invalid JSON in request body'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('MCP Request:', JSON.stringify(mcpRequest, null, 2))

    // Process the MCP request based on method
    switch (mcpRequest.method) {
      case 'initialize':
        console.log('Handling initialize request')
        return new Response(
          JSON.stringify({
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: false
                },
                resources: {
                  subscribe: false,
                  listChanged: false
                }
              },
              serverInfo: {
                name: 'TravelShare Flight MCP Server',
                version: '1.0.0',
                description: 'Mock flight booking and search server for travel planning'
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'tools/list':
        console.log('Handling tools/list request')
        return new Response(
          JSON.stringify({
            result: {
              tools: [
                {
                  name: 'search_flights',
                  description: 'Search for flights between destinations (returns all flight data regardless of parameters)',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      from: {
                        type: 'string',
                        description: 'Departure city or airport (optional)'
                      },
                      to: {
                        type: 'string',
                        description: 'Destination city or airport (optional)'
                      },
                      query: {
                        type: 'string',
                        description: 'General search query (optional)'
                      }
                    }
                  }
                }
              ]
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'tools/call':
        console.log('Handling tools/call request')
        const toolName = mcpRequest.params?.name
        const args = mcpRequest.params?.arguments || {}
        console.log('Tool name:', toolName, 'Args:', args)

        if (toolName === 'search_flights') {
          // ALWAYS return all flight data regardless of parameters
          console.log('Returning all flight data for AI processing')
          
          const formattedFlights = mockFlights.map(f => 
            `✈️ **${f.airline} ${f.flightNumber}**\n` +
            `   Route: ${f.from} → ${f.to}\n` +
            `   Departure: ${f.departure} | Arrival: ${f.arrival}\n` +
            `   Duration: ${f.duration} | Aircraft: ${f.aircraft}\n` +
            `   Price: ${f.price} (${f.class}) | Status: ${f.availability}\n` +
            `   ${f.stops}\n`
          ).join('\n')

          return new Response(
            JSON.stringify({
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Here is our complete flight database (${mockFlights.length} flights):\n\n${formattedFlights}\n\nNote: This is mock flight data. The AI should extract relevant information based on the user's query.`
                  }
                ]
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          console.log('Unknown tool:', toolName)
          return new Response(
            JSON.stringify({
              error: {
                code: -1,
                message: `Unknown tool: ${toolName}. Available tools: search_flights`
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      default:
        console.log('Unknown method:', mcpRequest.method)
        return new Response(
          JSON.stringify({
            error: {
              code: -1,
              message: `Unknown method: ${mcpRequest.method}`
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error: any) {
    console.error('Error in mock flight MCP server:', error)
    
    // Make sure we never return authentication errors from this mock server
    return new Response(
      JSON.stringify({
        result: {
          message: 'Mock Flight MCP Server encountered an error but is running',
          error: error.message,
          note: 'This server provides flight information for travel planning'
        }
      }),
      { 
        status: 200, // Return 200 instead of 500 to avoid auth errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})