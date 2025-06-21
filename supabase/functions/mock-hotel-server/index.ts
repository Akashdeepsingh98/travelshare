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

// Mock hotel data that complements the restaurant and flight locations
const mockHotels = [
  {
    id: 'hotel-1',
    name: 'Grand Plaza Hotel',
    location: 'New York, USA',
    address: '123 Broadway, Manhattan, New York',
    stars: 4.5,
    priceRange: '$$$',
    roomTypes: ['Standard', 'Deluxe', 'Suite'],
    amenities: ['Free WiFi', 'Pool', 'Fitness Center', 'Restaurant', 'Room Service'],
    availability: 'Available',
    nearbyAttractions: ['Times Square', 'Central Park', 'Empire State Building'],
    rating: 4.7,
    reviews: 1250,
    description: 'Luxury hotel in the heart of Manhattan with stunning city views'
  },
  {
    id: 'hotel-2',
    name: 'Riverside Inn',
    location: 'London, UK',
    address: '45 Thames Street, Westminster, London',
    stars: 4,
    priceRange: '$$',
    roomTypes: ['Standard', 'Family', 'Executive'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Bar', 'Concierge'],
    availability: 'Limited Rooms',
    nearbyAttractions: ['Big Ben', 'London Eye', 'Buckingham Palace'],
    rating: 4.5,
    reviews: 980,
    description: 'Charming hotel with views of the River Thames and easy access to landmarks'
  },
  {
    id: 'hotel-3',
    name: 'Sakura Ryokan',
    location: 'Tokyo, Japan',
    address: '78 Asakusa Street, Taito, Tokyo',
    stars: 4,
    priceRange: '$$$',
    roomTypes: ['Traditional', 'Modern', 'Family'],
    amenities: ['Onsen Bath', 'Traditional Breakfast', 'Yukata Provided', 'Free WiFi'],
    availability: 'Available',
    nearbyAttractions: ['Senso-ji Temple', 'Tokyo Skytree', 'Ueno Park'],
    rating: 4.8,
    reviews: 750,
    description: 'Authentic Japanese ryokan experience with modern comforts'
  },
  {
    id: 'hotel-4',
    name: 'Eiffel View Hotel',
    location: 'Paris, France',
    address: '15 Avenue de la Bourdonnais, Paris',
    stars: 4,
    priceRange: '$$$',
    roomTypes: ['Classic', 'Superior', 'Eiffel View Suite'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Rooftop Terrace', 'Bar'],
    availability: 'Available',
    nearbyAttractions: ['Eiffel Tower', 'Champ de Mars', 'Les Invalides'],
    rating: 4.6,
    reviews: 1120,
    description: 'Boutique hotel with stunning views of the Eiffel Tower'
  },
  {
    id: 'hotel-5',
    name: 'Colosseum Boutique Hotel',
    location: 'Rome, Italy',
    address: '34 Via Cavour, Rome',
    stars: 3.5,
    priceRange: '$$',
    roomTypes: ['Standard', 'Superior', 'Family'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Airport Shuttle', 'Tour Desk'],
    availability: 'Available',
    nearbyAttractions: ['Colosseum', 'Roman Forum', 'Trevi Fountain'],
    rating: 4.4,
    reviews: 860,
    description: 'Charming boutique hotel in the historic center of Rome'
  },
  {
    id: 'hotel-6',
    name: 'Budget City Hostel',
    location: 'London, UK',
    address: '89 Camden High Street, London',
    stars: 2.5,
    priceRange: '$',
    roomTypes: ['Dormitory', 'Private Single', 'Private Double'],
    amenities: ['Free WiFi', 'Shared Kitchen', 'Lounge', 'Laundry'],
    availability: 'Available',
    nearbyAttractions: ['Camden Market', 'Regent\'s Park', 'British Museum'],
    rating: 4.2,
    reviews: 520,
    description: 'Affordable and friendly hostel in the vibrant Camden area'
  }
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Mock Hotel MCP Server - Request received:', req.method, req.url)
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
              message: 'Mock Hotel MCP Server is running',
              status: 'ok',
              note: 'This server provides hotel information for travel planning'
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
                name: 'TravelShare Hotel MCP Server',
                version: '1.0.0',
                description: 'Mock hotel booking and search server for travel planning'
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
                  name: 'search_hotels',
                  description: 'Search for hotels by location, price range, or amenities',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'string',
                        description: 'City or area to search for hotels'
                      },
                      price_range: {
                        type: 'string',
                        description: 'Price range ($ for budget, $$ for mid-range, $$$ for luxury)'
                      },
                      amenities: {
                        type: 'string',
                        description: 'Comma-separated list of desired amenities'
                      }
                    }
                  }
                },
                {
                  name: 'get_hotel_details',
                  description: 'Get detailed information about a specific hotel',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      hotel_id: {
                        type: 'string',
                        description: 'Hotel ID'
                      }
                    },
                    required: ['hotel_id']
                  }
                },
                {
                  name: 'check_hotel_availability',
                  description: 'Check availability for hotels in a location',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'string',
                        description: 'Location to check hotel availability'
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

        switch (toolName) {
          case 'search_hotels':
            const location = args.location?.toLowerCase() || ''
            const priceRange = args.price_range?.toLowerCase() || ''
            const amenities = args.amenities?.toLowerCase().split(',').map((a: string) => a.trim()) || []
            
            let filteredHotels = mockHotels
            
            if (location || priceRange || amenities.length > 0) {
              filteredHotels = mockHotels.filter(hotel => {
                const matchesLocation = !location || 
                  hotel.location.toLowerCase().includes(location)
                
                const matchesPriceRange = !priceRange || 
                  hotel.priceRange.toLowerCase().includes(priceRange)
                
                const matchesAmenities = amenities.length === 0 || 
                  amenities.every(amenity => 
                    hotel.amenities.some(a => a.toLowerCase().includes(amenity))
                  )
                
                return matchesLocation && matchesPriceRange && matchesAmenities
              })
            }

            console.log('Hotel search results:', filteredHotels.length, 'hotels found')

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `Found ${filteredHotels.length} hotels:\n\n${filteredHotels.map(h => 
                        `🏨 **${h.name}** (${h.stars}⭐)\n` +
                        `   Location: ${h.location}\n` +
                        `   Price Range: ${h.priceRange} | Rating: ${h.rating}/5 (${h.reviews} reviews)\n` +
                        `   Room Types: ${h.roomTypes.join(', ')}\n` +
                        `   Key Amenities: ${h.amenities.slice(0, 3).join(', ')}${h.amenities.length > 3 ? '...' : ''}\n` +
                        `   Availability: ${h.availability}\n` +
                        `   ${h.description}\n`
                      ).join('\n')}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          case 'get_hotel_details':
            const hotelId = args.hotel_id
            const hotel = mockHotels.find(h => h.id === hotelId)
            
            if (!hotel) {
              return new Response(
                JSON.stringify({
                  error: {
                    code: -1,
                    message: 'Hotel not found'
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
                      text: `🏨 **${hotel.name}**\n\n` +
                            `📍 Location: ${hotel.location}\n` +
                            `🏢 Address: ${hotel.address}\n` +
                            `⭐ Rating: ${hotel.stars} stars (${hotel.rating}/5 from ${hotel.reviews} reviews)\n` +
                            `💰 Price Range: ${hotel.priceRange}\n` +
                            `🛏️ Room Types: ${hotel.roomTypes.join(', ')}\n` +
                            `📅 Availability: ${hotel.availability}\n\n` +
                            `**Amenities:**\n${hotel.amenities.map(a => `• ${a}`).join('\n')}\n\n` +
                            `**Nearby Attractions:**\n${hotel.nearbyAttractions.map(a => `• ${a}`).join('\n')}\n\n` +
                            `**Description:** ${hotel.description}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          case 'check_hotel_availability':
            const checkLocation = args.location?.toLowerCase() || ''
            const availableHotels = mockHotels.filter(h => 
              h.availability === 'Available' && 
              (!checkLocation || h.location.toLowerCase().includes(checkLocation))
            )

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `🟢 **Available Hotels** ${checkLocation ? `in ${args.location}` : ''}:\n\n${availableHotels.map(h => 
                        `• **${h.name}** (${h.stars}⭐) - ${h.location}\n` +
                        `  Price Range: ${h.priceRange} | Rating: ${h.rating}/5 | Room Types: ${h.roomTypes.join(', ')}`
                      ).join('\n')}\n\n` +
                      `Total available hotels: ${availableHotels.length}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          default:
            console.log('Unknown tool:', toolName)
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
    console.error('Error in mock hotel MCP server:', error)
    
    // Make sure we never return authentication errors from this mock server
    return new Response(
      JSON.stringify({
        result: {
          message: 'Mock Hotel MCP Server encountered an error but is running',
          error: error.message,
          note: 'This server provides hotel information for travel planning'
        }
      }),
      { 
        status: 200, // Return 200 instead of 500 to avoid auth errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})