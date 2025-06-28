import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ItineraryRequest {
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  preferences: string[];
  notes?: string;
  userId: string;
  existingItinerary?: {
    id: string;
    items: any[];
  };
  refinementInstructions?: string;
}

interface ItineraryDay {
  day: number;
  items: {
    time?: string;
    title: string;
    description?: string;
    location?: string;
    category?: 'accommodation' | 'activity' | 'food' | 'transportation' | 'other';
    cost?: number;
    notes?: string;
    order: number;
  }[];
}

interface GeneratedItinerary {
  title: string;
  destination: string;
  days: ItineraryDay[];
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

    const { destination, startDate, endDate, budget, preferences, notes, userId }: ItineraryRequest = await req.json()

    if (!destination?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Destination is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!preferences || preferences.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one preference is required' }),
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

    // Calculate number of days for the itinerary
    let numDays = 3; // Default to 3 days
    
    // If we have an existing itinerary, use its number of days
    if (existingItinerary?.items && existingItinerary.items.length > 0) {
      // Find the highest day number in the existing items
      numDays = Math.max(...existingItinerary.items.map(item => item.day));
    } else if (startDate && endDate) {
      // Otherwise calculate from dates if provided
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Format preferences for the prompt
    const formattedPreferences = preferences.map(pref => {
      // Map preference IDs to readable labels
      const prefMap: Record<string, string> = {
        'culture': 'Cultural Experiences',
        'nature': 'Nature & Outdoors',
        'food': 'Food & Dining',
        'adventure': 'Adventure Activities',
        'relaxation': 'Relaxation',
        'shopping': 'Shopping',
        'nightlife': 'Nightlife',
        'family': 'Family-Friendly Activities',
        'budget': 'Budget-Friendly Options',
        'luxury': 'Luxury Experiences',
        'history': 'Historical Sites',
        'art': 'Art & Museums',
        'beach': 'Beaches',
        'mountains': 'Mountains',
        'photography': 'Photography Spots'
      };
      
      return prefMap[pref] || pref;
    }).join(', ');

    // Format budget for the prompt
    let budgetDescription = '';
    if (budget) {
      switch (budget) {
        case 'budget':
          budgetDescription = 'Budget-friendly options, focusing on affordable accommodations, public transportation, and inexpensive dining options.';
          break;
        case 'moderate':
          budgetDescription = 'Moderate budget with mid-range accommodations, some taxis/rideshares, and a mix of casual and nicer restaurants.';
          break;
        case 'luxury':
          budgetDescription = 'Luxury experience with high-end accommodations, private transportation, and fine dining options.';
          break;
        default:
          budgetDescription = budget;
      }
    }

    // Determine if this is a new itinerary or a refinement
    const isRefinement = !!existingItinerary && !!refinementInstructions;
    
    let prompt;
    
    if (isRefinement) {
      // Create a refinement prompt
      prompt = `Refine an existing travel itinerary for a trip to ${destination} based on the following instructions: "${refinementInstructions}".

EXISTING ITINERARY:
Title: ${itinerary.title}
Destination: ${destination}
${startDate && endDate ? `Dates: ${startDate} to ${endDate} (${numDays} days)` : `Duration: ${numDays} days`}
${budget ? `Budget: ${budgetDescription}` : ''}
Preferences: ${formattedPreferences}
${notes ? `Additional Notes: ${notes}` : ''}

Current Day-by-Day Schedule:
${existingItinerary.items.map(item => {
  return `Day ${item.day}, ${item.time || 'No time specified'}: ${item.title} - ${item.description || 'No description'} (${item.category || 'No category'})${item.location ? ` at ${item.location}` : ''}${item.cost ? `, Cost: $${item.cost}` : ''}`;
}).join('\n')}

REFINEMENT INSTRUCTIONS:
${refinementInstructions}

I need you to refine this itinerary while maintaining the same structure. Keep what works well, but modify it according to the refinement instructions. Provide a comprehensive day-by-day itinerary with the following structure:
1. A catchy, descriptive title for the overall itinerary (you can keep the existing one or create a new one)
2. For each day, provide:
   - Multiple activities/locations with approximate times
   - Brief descriptions of each activity/location
   - Category for each item (accommodation, activity, food, transportation, other)
   - Estimated cost for each item when applicable
   - Location details
   - Any special notes or tips`;
    } else {
      // Create a new itinerary prompt
      prompt = `Create a detailed travel itinerary for a trip to ${destination}.

TRIP DETAILS:
- Destination: ${destination}
${startDate && endDate ? `- Dates: ${startDate} to ${endDate} (${numDays} days)` : `- Duration: ${numDays} days`}
${budget ? `- Budget: ${budgetDescription}` : ''}
- Preferences: ${formattedPreferences}
${notes ? `- Additional Notes: ${notes}` : ''}

I need a comprehensive day-by-day itinerary with the following structure:
1. A catchy, descriptive title for the overall itinerary
2. For each day, provide:
   - Multiple activities/locations with approximate times
   - Brief descriptions of each activity/location
   - Category for each item (accommodation, activity, food, transportation, other)
   - Estimated cost for each item when applicable
   - Location details
   - Any special notes or tips

Format the response as a structured JSON object with the following schema:
{
  "title": "Catchy title for the itinerary",
  "destination": "${destination}",
  "days": [
    {
      "day": 1,
      "items": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "Brief description",
          "location": "Specific location",
          "category": "activity", // One of: accommodation, activity, food, transportation, other
          "cost": 25, // Numeric value in USD, no currency symbol
          "notes": "Optional special notes",
          "order": 1 // Position in the day's schedule
        },
        // More items for day 1...
      ]
    },
    // More days...
  ]
}

IMPORTANT GUIDELINES:
- Create exactly ${numDays} days in the itinerary
- Make sure each day has 4-6 activities/items
- Include at least one meal (category: "food") per day
- Include accommodation for the first day (category: "accommodation")
- Ensure all costs are numeric values without currency symbols
- Make sure all required fields are present
- Ensure the JSON is valid and properly formatted
- Focus on activities that match the user's preferences: ${formattedPreferences}
${budget ? `- Keep suggestions within the ${budget} budget range` : ''}
${notes ? `- Incorporate these special requests: ${notes}` : ''}

The response should ONLY contain the JSON object, nothing else.`;
    }
    
    // Add the common format instructions for both new and refinement prompts
    prompt += `

Format the response as a structured JSON object with the following schema:
{
  "title": "Catchy title for the itinerary",
  "destination": "${destination}",
  "days": [
    {
      "day": 1,
      "items": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "Brief description",
          "location": "Specific location",
          "category": "activity", // One of: accommodation, activity, food, transportation, other
          "cost": 25, // Numeric value in USD, no currency symbol
          "notes": "Optional special notes",
          "order": 1 // Position in the day's schedule
        },
        // More items for day 1...
      ]
    },
    // More days...
  ]
}

IMPORTANT GUIDELINES:
- Create exactly ${numDays} days in the itinerary
- Make sure each day has 4-6 activities/items
- Include at least one meal (category: "food") per day
- Include accommodation for the first day (category: "accommodation")
- Ensure all costs are numeric values without currency symbols
- Make sure all required fields are present
- Ensure the JSON is valid and properly formatted
- Focus on activities that match the user's preferences: ${formattedPreferences}
${budget ? `- Keep suggestions within the ${budget} budget range` : ''}
${notes ? `- Incorporate these special requests: ${notes}` : ''}

The response should ONLY contain the JSON object, nothing else.`;

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
      
      // Parse the JSON response
      let itineraryData: GeneratedItinerary;
      try {
        // Clean up the response to ensure it's valid JSON
        const cleanedResponse = aiResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        itineraryData = JSON.parse(cleanedResponse);
        
        // Validate the structure
        if (!itineraryData.title || !itineraryData.destination || !itineraryData.days) {
          throw new Error('Invalid itinerary structure');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw AI response:', aiResponse);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to parse AI-generated itinerary',
            details: parseError.message
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Save the itinerary to the database
      try {
        // First, create the itinerary record
        const { data: itineraryRecord, error: itineraryError } = await supabaseClient
          .from('itineraries')
          .insert({
            user_id: userId,
            title: itineraryData.title,
            destination: itineraryData.destination,
            start_date: startDate || null,
            end_date: endDate || null,
            budget: budget || null,
            preferences: preferences,
            notes: notes || null,
            is_public: false
          })
          .select()
          .single();
        
        if (itineraryError) {
          throw itineraryError;
        }
        
        // Then, create all the itinerary items
        let itineraryId = itineraryRecord.id;
        
        // If this is a refinement, use the existing itinerary ID and delete old items
        if (isRefinement && existingItinerary) {
          itineraryId = existingItinerary.id;
          
          // Delete existing items
          const { error: deleteError } = await supabaseClient
            .from('itinerary_items')
            .delete()
            .eq('itinerary_id', itineraryId);
          
          if (deleteError) {
            console.error('Error deleting existing itinerary items:', deleteError);
            throw deleteError;
          }
          
          // Update the itinerary record with any new details
          const { error: updateError } = await supabaseClient
            .from('itineraries')
            .update({
              title: itineraryData.title,
              updated_at: new Date().toISOString()
            })
            .eq('id', itineraryId);
          
          if (updateError) {
            console.error('Error updating itinerary:', updateError);
            throw updateError;
          }
        }
        
        // Create new itinerary items
        const newItems = itineraryData.days.flatMap(day => 
          day.items.map(item => {
            // Ensure cost is a number or null
            let cost = null;
            if (item.cost !== undefined && item.cost !== null) {
              cost = typeof item.cost === 'number' ? item.cost : parseFloat(item.cost);
              if (isNaN(cost)) cost = null;
            }
            
            return {
              itinerary_id: itineraryId,
              day: day.day,
              time: item.time || null,
              title: item.title,
              description: item.description || null,
              location: item.location || null,
              category: item.category || null,
              cost: cost,
              notes: item.notes || null,
              order: item.order
            };
          })
        );
        
        // Insert new items
        const { error: itemsError } = await supabaseClient
          .from('itinerary_items')
          .insert(newItems);
        
        if (itemsError) {
          throw itemsError;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            itineraryId: itineraryId,
            message: isRefinement ? 'Itinerary refined successfully' : 'Itinerary created successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to save itinerary to database',
            details: dbError.message
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

    } catch (geminiError: any) {
      console.error('Gemini API error details:', {
        message: geminiError.message,
        status: geminiError.status,
        code: geminiError.code,
        details: geminiError.details,
        stack: geminiError.stack
      })
      
      let errorMessage = 'Failed to generate itinerary'
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
    console.error('Error in AI itinerary builder function:', {
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