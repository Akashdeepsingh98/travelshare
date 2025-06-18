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

// Mock restaurant data
const mockRestaurants = [
  {
    id: '1',
    name: 'Tokyo Ramen House',
    location: 'Tokyo, Japan',
    cuisine: 'Japanese',
    rating: 4.8,
    priceRange: '$$',
    specialties: ['Tonkotsu Ramen', 'Gyoza', 'Chicken Karaage'],
    hours: '11:00 AM - 10:00 PM',
    availability: 'Available',
    description: 'Authentic Japanese ramen with rich tonkotsu broth'
  },
  {
    id: '2',
    name: 'Pasta Bella',
    location: 'Rome, Italy',
    cuisine: 'Italian',
    rating: 4.6,
    priceRange: '$$$',
    specialties: ['Carbonara', 'Cacio e Pepe', 'Amatriciana'],
    hours: '12:00 PM - 11:00 PM',
    availability: 'Fully Booked',
    description: 'Traditional Roman pasta dishes in the heart of Rome'
  },
  {
    id: '3',
    name: 'Le Petit Bistro',
    location: 'Paris, France',
    cuisine: 'French',
    rating: 4.7,
    priceRange: '$$$$',
    specialties: ['Coq au Vin', 'Bouillabaisse', 'Crème Brûlée'],
    hours: '6:00 PM - 12:00 AM',
    availability: 'Limited Seats',
    description: 'Classic French bistro with seasonal menu'
  },
  {
    id: '4',
    name: 'Spice Garden',
    location: 'Bangkok, Thailand',
    cuisine: 'Thai',
    rating: 4.5,
    priceRange: '$',
    specialties: ['Pad Thai', 'Tom Yum Soup', 'Green Curry'],
    hours: '10:00 AM - 9:00 PM',
    availability: 'Available',
    description: 'Authentic Thai street food and traditional dishes'
  },
  {
    id: '5',
    name: 'Taco Libre',
    location: 'Mexico City, Mexico',
    cuisine: 'Mexican',
    rating: 4.4,
    priceRange: '$',
    specialties: ['Al Pastor Tacos', 'Guacamole', 'Churros'],
    hours: '8:00 AM - 11:00 PM',
    availability: 'Available',
    description: 'Fresh Mexican street tacos and traditional favorites'
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const mcpRequest: MCPRequest = await req.json()
    
    console.log('MCP Request:', mcpRequest)

    switch (mcpRequest.method) {
      case 'initialize':
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
                name: 'TravelShare Restaurant MCP Server',
                version: '1.0.0'
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'tools/list':
        return new Response(
          JSON.stringify({
            result: {
              tools: [
                {
                  name: 'search_restaurants',
                  description: 'Search for restaurants by location, cuisine, or name',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Search query (location, cuisine, or restaurant name)'
                      },
                      location: {
                        type: 'string',
                        description: 'Specific location to search in'
                      }
                    }
                  }
                },
                {
                  name: 'get_restaurant_details',
                  description: 'Get detailed information about a specific restaurant',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      restaurant_id: {
                        type: 'string',
                        description: 'Restaurant ID'
                      }
                    },
                    required: ['restaurant_id']
                  }
                },
                {
                  name: 'check_availability',
                  description: 'Check current availability for restaurants',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'string',
                        description: 'Location to check availability'
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
        const toolName = mcpRequest.params?.name
        const args = mcpRequest.params?.arguments || {}

        switch (toolName) {
          case 'search_restaurants':
            const query = args.query?.toLowerCase() || ''
            const location = args.location?.toLowerCase() || ''
            
            let filteredRestaurants = mockRestaurants
            
            if (query || location) {
              filteredRestaurants = mockRestaurants.filter(restaurant => {
                const matchesQuery = !query || 
                  restaurant.name.toLowerCase().includes(query) ||
                  restaurant.cuisine.toLowerCase().includes(query) ||
                  restaurant.location.toLowerCase().includes(query) ||
                  restaurant.specialties.some(s => s.toLowerCase().includes(query))
                
                const matchesLocation = !location || 
                  restaurant.location.toLowerCase().includes(location)
                
                return matchesQuery && matchesLocation
              })
            }

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `Found ${filteredRestaurants.length} restaurants:\n\n${filteredRestaurants.map(r => 
                        `🍽️ **${r.name}** (${r.location})\n` +
                        `   Cuisine: ${r.cuisine} | Rating: ${r.rating}⭐ | Price: ${r.priceRange}\n` +
                        `   Specialties: ${r.specialties.join(', ')}\n` +
                        `   Hours: ${r.hours} | Status: ${r.availability}\n` +
                        `   ${r.description}\n`
                      ).join('\n')}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          case 'get_restaurant_details':
            const restaurantId = args.restaurant_id
            const restaurant = mockRestaurants.find(r => r.id === restaurantId)
            
            if (!restaurant) {
              return new Response(
                JSON.stringify({
                  error: {
                    code: -1,
                    message: 'Restaurant not found'
                  }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `🍽️ **${restaurant.name}**\n\n` +
                            `📍 Location: ${restaurant.location}\n` +
                            `🍴 Cuisine: ${restaurant.cuisine}\n` +
                            `⭐ Rating: ${restaurant.rating}/5.0\n` +
                            `💰 Price Range: ${restaurant.priceRange}\n` +
                            `🕒 Hours: ${restaurant.hours}\n` +
                            `📅 Availability: ${restaurant.availability}\n\n` +
                            `**Specialties:**\n${restaurant.specialties.map(s => `• ${s}`).join('\n')}\n\n` +
                            `**Description:** ${restaurant.description}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          case 'check_availability':
            const checkLocation = args.location?.toLowerCase() || ''
            const availableRestaurants = mockRestaurants.filter(r => 
              r.availability === 'Available' && 
              (!checkLocation || r.location.toLowerCase().includes(checkLocation))
            )

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `🟢 **Available Restaurants** ${checkLocation ? `in ${args.location}` : ''}:\n\n${availableRestaurants.map(r => 
                        `• **${r.name}** (${r.location}) - ${r.cuisine} cuisine, ${r.rating}⭐`
                      ).join('\n')}\n\n` +
                      `Total available: ${availableRestaurants.length} restaurants`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          default:
            return new Response(
              JSON.stringify({
                error: {
                  code: -1,
                  message: `Unknown tool: ${toolName}`
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

      default:
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
    console.error('Error in mock MCP server:', error)
    return new Response(
      JSON.stringify({
        error: {
          code: -1,
          message: 'Internal server error',
          details: error.message
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})