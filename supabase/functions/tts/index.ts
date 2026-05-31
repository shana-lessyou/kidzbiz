import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY    = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const VALID_VOICES = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY secret is not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) throw new Error('Unauthorized');

    const { text, voice = 'nova', speed = 0.9 } = await req.json();
    if (!text) throw new Error('text required');

    // Sanitise voice — fall back to nova if an invalid ID is passed (e.g. old browser voice name)
    const safeVoice = VALID_VOICES.has(voice) ? voice : 'nova';

    // Cap at 1 000 chars to keep costs predictable
    const input = String(text).slice(0, 1000);

    console.log(`TTS: user=${user.id} voice=${safeVoice} chars=${input.length}`);

    const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'tts-1', input, voice: safeVoice, speed }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error('OpenAI TTS error:', openaiRes.status, errBody);
      throw new Error(`OpenAI TTS error ${openaiRes.status}: ${errBody}`);
    }

    // Buffer the full MP3 into memory — streaming res.body is unreliable in Supabase edge functions
    const audioBuffer = await openaiRes.arrayBuffer();
    console.log(`TTS: returning ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Content-Length': String(audioBuffer.byteLength) },
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error('TTS function error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
