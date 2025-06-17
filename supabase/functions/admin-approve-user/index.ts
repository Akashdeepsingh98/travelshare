import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ApprovalRequest {
  userId: string;
  approved: boolean;
  adminId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, approved, adminId }: ApprovalRequest = await req.json()

    if (!userId || typeof approved !== 'boolean' || !adminId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, approved, adminId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify admin user is approved
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('is_approved')
      .eq('id', adminId)
      .single()

    if (adminError || !adminProfile?.is_approved) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin user not found or not approved' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update user approval status
    const updateData = approved 
      ? {
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: adminId
        }
      : {
          is_approved: false,
          approved_at: null,
          approved_by: null
        }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, is_approved, approved_at')
      .single()

    if (error) {
      console.error('Error updating user approval:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update user approval status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // TODO: Send email notification to user about approval status
    // This would require setting up email service (SendGrid, etc.)

    return new Response(
      JSON.stringify({ 
        success: true,
        user: data,
        message: approved ? 'User approved successfully' : 'User approval revoked'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error in admin approval function:', error)
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