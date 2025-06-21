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

// Mock taxi/transportation data that complements restaurant and flight locations
const mockTransportation = [
  {
    id: 'taxi-1',
    service: 'CityRide',
    type: 'Standard Taxi',
    location: 'New York, USA',
    availability: 'Available Now',
    estimatedArrival: '3-5 minutes',
    priceRange: '$15-25',
    rating: 4.8,
    vehicleType: 'Toyota Camry',
    capacity: '4 passengers',
    features: ['Air Conditioning', 'Card Payment', 'GPS Tracking'],
    driverRating: 4.9,
    description: 'Reliable taxi service in Manhattan and surrounding areas'
  },
  {
    id: 'taxi-2',
    service: 'London Black Cabs',
    type: 'Traditional Black Cab',
    location: 'London, UK',
    availability: 'Available Now',
    estimatedArrival: '2-4 minutes',
    priceRange: '£12-20',
    rating: 4.7,
    vehicleType: 'TX4 London Taxi',
    capacity: '5 passengers',
    features: ['Wheelchair Accessible', 'Card Payment', 'Local Knowledge'],
    driverRating: 4.8,
    description: 'Iconic London black cabs with knowledgeable drivers'
  },
  {
    id: 'taxi-3',
    service: 'Paris Express',
    type: 'Premium Taxi',
    location: 'Paris, France',
    availability: 'Available Now',
    estimatedArrival: '4-7 minutes',
    priceRange: '€18-30',
    rating: 4.6,
    vehicleType: 'Mercedes E-Class',
    capacity: '4 passengers',
    features: ['Luxury Interior', 'WiFi', 'Phone Charger', 'Multilingual Driver'],
    driverRating: 4.7,
    description: 'Premium taxi service for comfortable travel in Paris'
  },
  {
    id: 'taxi-4',
    service: 'Tokyo Taxi',
    type: 'Standard Taxi',
    location: 'Tokyo, Japan',
    availability: 'Available Now',
    estimatedArrival: '5-8 minutes',
    priceRange: '¥800-1500',
    rating: 4.9,
    vehicleType: 'Toyota Crown',
    capacity: '4 passengers',
    features: ['Automatic Doors', 'White Gloves Service', 'GPS Navigation'],
    driverRating: 4.9,
    description: 'Professional taxi service with exceptional customer service'
  },
  {
    id: 'taxi-5',
    service: 'Roma Taxi',
    type: 'City Taxi',
    location: 'Rome, Italy',
    availability: 'Available Now',
    estimatedArrival: '6-10 minutes',
    priceRange: '€15-25',
    rating: 4.4,
    vehicleType: 'Fiat 500X',
    capacity: '4 passengers',
    features: ['Air Conditioning', 'Card Payment', 'Tourist Guide'],
    driverRating: 4.5,
    description: 'Local taxi service with tourist-friendly drivers'
  },
  {
    id: 'ride-1',
    service: 'QuickRide',
    type: 'Ride Share',
    location: 'New York, USA',
    availability: 'Available Now',
    estimatedArrival: '2-3 minutes',
    priceRange: '$8-15',
    rating: 4.5,
    vehicleType: 'Honda Accord',
    capacity: '4 passengers',
    features: ['App Booking', 'Real-time Tracking', 'Split Fare'],
    driverRating: 4.6,
    description: 'Affordable ride-sharing service with quick pickup times'
  },
  {
    id: 'shuttle-1',
    service: 'Airport Express',
    type: 'Airport Shuttle',
    location: 'London, UK',
    availability: 'Scheduled Service',
    estimatedArrival: '15-20 minutes',
    priceRange: '£25-35',
    rating: 4.3,
    vehicleType: 'Mercedes Sprinter',
    capacity: '8 passengers',
    features: ['Luggage Space', 'WiFi', 'Airport Direct'],
    driverRating: 4.4,
    description: 'Direct shuttle service to/from Heathrow Airport'
  }
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Mock Taxi MCP Server - Request received:', req.method, req.url)
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
              message: 'Mock Taxi MCP Server is running',
              status: 'ok',
              note: 'This server provides transportation and taxi services'
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
                name: 'TravelShare Transportation MCP Server',
                version: '1.0.0',
                description: 'Mock taxi and transportation service for travel convenience'
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
                  name: 'search_transportation',
                  description: 'Search for taxi and transportation services by location',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'string',
                        description: 'Location to search for transportation'
                      },
                      type: {
                        type: 'string',
                        description: 'Type of transportation (taxi, rideshare, shuttle)'
                      },
                      query: {
                        type: 'string',
                        description: 'General search query'
                      }
                    }
                  }
                },
                {
                  name: 'get_transportation_details',
                  description: 'Get detailed information about a specific transportation service',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      service_id: {
                        type: 'string',
                        description: 'Transportation service ID'
                      }
                    },
                    required: ['service_id']
                  }
                },
                {
                  name: 'check_availability',
                  description: 'Check current availability of transportation services',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'string',
                        description: 'Location to check availability'
                      }
                    }
                  }
                },
                {
                  name: 'estimate_fare',
                  description: 'Get fare estimates for transportation',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      from: {
                        type: 'string',
                        description: 'Starting location'
                      },
                      to: {
                        type: 'string',
                        description: 'Destination'
                      },
                      service_type: {
                        type: 'string',
                        description: 'Type of service'
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
          case 'search_transportation':
            const location = args.location?.toLowerCase() || ''
            const type = args.type?.toLowerCase() || ''
            const query = args.query?.toLowerCase() || ''
            
            let filteredTransportation = mockTransportation
            
            if (location || type || query) {
              filteredTransportation = mockTransportation.filter(transport => {
                const matchesLocation = !location || 
                  transport.location.toLowerCase().includes(location)
                
                const matchesType = !type || 
                  transport.type.toLowerCase().includes(type) ||
                  transport.service.toLowerCase().includes(type)
                
                const matchesQuery = !query ||
                  transport.service.toLowerCase().includes(query) ||
                  transport.type.toLowerCase().includes(query) ||
                  transport.location.toLowerCase().includes(query) ||
                  transport.description.toLowerCase().includes(query)
                
                return matchesLocation && matchesType && matchesQuery
              })
            }

            console.log('Transportation search results:', filteredTransportation.length, 'services found')

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `Found ${filteredTransportation.length} transportation services:\n\n${filteredTransportation.map(t => 
                        `🚗 **${t.service}** (${t.type})\n` +
                        `   Location: ${t.location}\n` +
                        `   Availability: ${t.availability} | ETA: ${t.estimatedArrival}\n` +
                        `   Price Range: ${t.priceRange} | Rating: ${t.rating}⭐\n` +
                        `   Vehicle: ${t.vehicleType} | Capacity: ${t.capacity}\n` +
                        `   Features: ${t.features.join(', ')}\n` +
                        `   ${t.description}\n`
                      ).join('\n')}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          case 'get_transportation_details':
            const serviceId = args.service_id
            const service = mockTransportation.find(t => t.id === serviceId)
            
            if (!service) {
              return new Response(
                JSON.stringify({
                  error: {
                    code: -1,
                    message: 'Transportation service not found'
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
                      text: `🚗 **${service.service}** - ${service.type}\n\n` +
                            `📍 Location: ${service.location}\n` +
                            `🕒 Availability: ${service.availability}\n` +
                            `⏱️ Estimated Arrival: ${service.estimatedArrival}\n` +
                            `💰 Price Range: ${service.priceRange}\n` +
                            `⭐ Rating: ${service.rating}/5.0\n` +
                            `🚙 Vehicle: ${service.vehicleType}\n` +
                            `👥 Capacity: ${service.capacity}\n` +
                            `👨‍✈️ Driver Rating: ${service.driverRating}/5.0\n\n` +
                            `**Features:**\n${service.features.map(f => `• ${f}`).join('\n')}\n\n` +
                            `**Description:** ${service.description}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          case 'check_availability':
            const checkLocation = args.location?.toLowerCase() || ''
            const availableServices = mockTransportation.filter(t => 
              t.availability === 'Available Now' && 
              (!checkLocation || t.location.toLowerCase().includes(checkLocation))
            )

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `🟢 **Available Transportation** ${checkLocation ? `in ${args.location}` : ''}:\n\n${availableServices.map(t => 
                        `• **${t.service}** (${t.type}) - ${t.location}\n` +
                        `  ETA: ${t.estimatedArrival} | Price: ${t.priceRange} | Rating: ${t.rating}⭐`
                      ).join('\n')}\n\n` +
                      `Total available services: ${availableServices.length}`
                    }
                  ]
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

          case 'estimate_fare':
            const from = args.from || 'Current Location'
            const to = args.to || 'Destination'
            const serviceType = args.service_type?.toLowerCase() || 'standard'
            
            // Simple fare estimation based on service type
            const fareEstimates = [
              {
                service: 'Standard Taxi',
                estimate: '$15-25',
                duration: '15-20 minutes',
                type: 'taxi'
              },
              {
                service: 'Premium Taxi',
                estimate: '$25-35',
                duration: '15-20 minutes',
                type: 'premium'
              },
              {
                service: 'Ride Share',
                estimate: '$10-18',
                duration: '12-18 minutes',
                type: 'rideshare'
              }
            ]
            
            const relevantEstimates = fareEstimates.filter(est => 
              !serviceType || est.type.includes(serviceType) || serviceType.includes(est.type)
            )

            return new Response(
              JSON.stringify({
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `💰 **Fare Estimates** from ${from} to ${to}:\n\n${relevantEstimates.map(est => 
                        `🚗 **${est.service}**\n` +
                        `   Estimated Fare: ${est.estimate}\n` +
                        `   Estimated Duration: ${est.duration}\n`
                      ).join('\n')}\n` +
                      `*Estimates may vary based on traffic, time of day, and exact pickup/drop-off locations.*`
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
    console.error('Error in mock taxi MCP server:', error)
    
    // Make sure we never return authentication errors from this mock server
    return new Response(
      JSON.stringify({
        result: {
          message: 'Mock Taxi MCP Server encountered an error but is running',
          error: error.message,
          note: 'This server provides transportation and taxi services'
        }
      }),
      { 
        status: 200, // Return 200 instead of 500 to avoid auth errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})