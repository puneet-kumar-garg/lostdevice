// search edge function v3
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  imei?: string;
  serialNumber?: string;
  uuid?: string;
  brand?: string;
  model?: string;
}

interface SearchResult {
  id: string;
  device_name: string;
  device_type: string;
  brand: string;
  model: string;
  status: string;
  lost_date: string;
  last_location: string;
  front_image_url: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { imei, serialNumber, uuid, brand, model }: SearchRequest = await req.json();

    // Validate input
    if (!imei && !serialNumber && !uuid && !brand && !model) {
      return new Response(
        JSON.stringify({ error: 'At least one search criterion is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate length limits
    if (imei && imei.length > 20) {
      return new Response(
        JSON.stringify({ error: 'IMEI must be less than 20 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (serialNumber && serialNumber.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Serial number must be less than 50 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (uuid && uuid.length > 100) {
      return new Response(
        JSON.stringify({ error: 'UUID must be less than 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (brand && brand.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Brand must be less than 50 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (model && model.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Model must be less than 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trim inputs
    const trimmedImei = imei?.trim();
    const trimmedSerial = serialNumber?.trim();
    const trimmedUuid = uuid?.trim();
    const trimmedBrand = brand?.trim();
    const trimmedModel = model?.trim();

    console.log('Search request:', {
      imei: trimmedImei ? 'provided' : 'none',
      serial: trimmedSerial ? 'provided' : 'none',
      uuid: trimmedUuid ? 'provided' : 'none',
      brand: trimmedBrand ? 'provided' : 'none',
      model: trimmedModel ? 'provided' : 'none',
    });

    let query = supabaseClient
      .from('device_reports')
      .select('id, device_name, device_type, brand, model, status, lost_date, last_location, front_image_url')
      .eq('status', 'lost');

    // Apply search filters - use exact match for identifiers, pattern match for brand/model
    if (trimmedImei) {
      query = query.eq('imei', trimmedImei);
    } else if (trimmedSerial) {
      query = query.eq('serial_number', trimmedSerial);
    } else if (trimmedUuid) {
      query = query.eq('uuid_identifier', trimmedUuid);
    } else if (trimmedBrand || trimmedModel) {
      if (trimmedBrand) query = query.ilike('brand', `%${trimmedBrand}%`);
      if (trimmedModel) query = query.ilike('model', `%${trimmedModel}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} matching devices`);

    return new Response(
      JSON.stringify({ results: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-devices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
