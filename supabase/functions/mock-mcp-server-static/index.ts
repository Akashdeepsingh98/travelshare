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

// Fixed mock restaurant data - always returns the same data regardless of query
const staticMockRestaurants = [
  {
    id: 'static-1',
    name: 'Global Eats Cafe',
    location: 'New York, USA',
    cuisine: 'International',
    rating: 4.5,
    priceRange: '$$',
    specialties: ['World Fusion Bowl', 'International Tapas', 'Global Street Food'],
    hours: '8:00 AM - 10:00 PM',
    availability: 'Available',
    description: 'A cozy cafe offering dishes from around the world with a modern twist.'
  },
  {
    id: 'static-2',
    name: 'Spice Route Bistro',
    location: 'London, UK',
    cuisine: 'Indian',
    rating: 4.7,
    priceRange: '$$$',
    specialties: ['Butter Chicken', 'Biryani', 'Tandoori Platter'],
    hours: '12:00 PM - 11:00 PM',
    availability: 'Limited Seats',
    description: 'Authentic Indian flavors in a modern setting with traditional spices.'
  },
  {
    id: 'static-3',
    name: 'La Petite Creperie',
    location: 'Paris, France',
    cuisine: 'French',
    rating: 4.2,
    priceRange: '$$',
    specialties: ['Sweet Crepes', 'Savory Galettes', 'French Onion Soup'],
    hours: '7:00 AM - 9:00 PM',
    availability: 'Available',
    description: 'Charming spot for authentic French crepes and traditional bistro fare.'
  },
  {
    id: 'static-4',
    name: 'Sakura Sushi Bar',
    location: 'Tokyo, Japan',
    cuisine: 'Japanese',
    rating: 4.8,
    priceRange: '$$$$',
    specialties: ['Omakase', 'Fresh Sashimi', 'Specialty Rolls'],
    hours: '5:00 PM - 12:00 AM',
    availability: 'Fully Booked',
    description: 'Premium sushi experience with the freshest fish and traditional techniques.'
  },
  {
    id: 'static-5',
    name: 'Mama Mia Pizzeria',
    location: 'Rome, Italy',
    cuisine: 'Italian',
    rating: 4.4,
    priceRange: '$',
    specialties: ['Margherita Pizza', 'Carbonara', 'Tiramisu'],
    hours: '11:00 AM - 11:00 PM',
    availability: 'Available',
    description: 'Family-owned pizzeria serving authentic Roman-style pizza and pasta.'
  }
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Static Mock MCP Server - Request received:', req.method, req.url)
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
              message: 'Static Mock MCP Server is running',
              status: 'ok',
              note: 'This server returns fixed data for AI extraction testing'
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
                name: 'TravelShare Static Mock MCP Server',
                version: '1.0.0',
                description: 'Static restaurant data server for testing AI extraction capabilities'
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
                  name: 'search_restaurants',
                  description: 'Returns a fixed list of mock restaurants for AI processing (ignores all parameters)',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Search query (ignored - returns all static data)'
                      },
                      location: {
                        type: 'string',
                        description: 'Location filter (ignored - returns all static data)'
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

        if (toolName === 'search_restaurants') {
          // ALWAYS return the same static data regardless of query parameters
          console.log('Returning static restaurant data for AI processing')

          const formattedRestaurants = staticMockRestaurants.map(r => 
            `🍽️ **${r.name}** (${r.location})\n` +
            `   Cuisine: ${r.cuisine} | Rating: ${r.rating}⭐ | Price: ${r.priceRange}\n` +
            `   Specialties: ${r.specialties.join(', ')}\n` +
            `   Hours: ${r.hours} | Status: ${r.availability}\n` +
            `   ${r.description}\n`
          ).join('\n')

          return new Response(
            JSON.stringify({
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Here is our complete restaurant database (${staticMockRestaurants.length} restaurants):\n\n${formattedRestaurants}\n\nNote: This is static test data. The AI should extract relevant information based on the user's query.`
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
                message: `Unknown tool: ${toolName}. Available tools: search_restaurants`
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
    console.error('Error in static mock MCP server:', error)
    
    // Make sure we never return authentication errors from this mock server
    return new Response(
      JSON.stringify({
        result: {
          message: 'Static Mock MCP Server encountered an error but is running',
          error: error.message,
          note: 'This server returns fixed data for AI extraction testing'
        }
      }),
      { 
        status: 200, // Return 200 instead of 500 to avoid auth errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})