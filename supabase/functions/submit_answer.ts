// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const { session_id, participant_id, flashcard_id, chosen_idx, latency } = await req.json()
  if (!session_id || !participant_id || !flashcard_id || chosen_idx === undefined) {
    return new Response('Invalid body', { status: 400 })
  }

  // Fetch flashcard correct index
  const { data: card, error: cardErr } = await supabase
    .from('flashcards')
    .select('correct_idx')
    .eq('id', flashcard_id)
    .single()

  if (cardErr || !card) return new Response('Card not found', { status: 404 })

  const is_correct = chosen_idx === card.correct_idx
  const delta = is_correct ? Math.max(250, 1000 - latency) : 0

  // Insert answer row
  await supabase.from('quiz_answers').insert({
    participant_id,
    flashcard_id,
    chosen_idx,
    is_correct,
    latency_ms: latency,
  })

  // Update score if correct
  if (is_correct) {
    await supabase.rpc('increment_participant_score', {
      p_participant_id: participant_id,
      p_delta: delta,
    })
  }

  // Broadcast via Realtime
  const channelName = `quiz:session:${session_id}`
  await supabase.channel(channelName).send({
    type: 'broadcast',
    event: 'SCORE_UPDATE',
    payload: { participantId: participant_id, delta, total: null },
  })

  return new Response(JSON.stringify({ is_correct, delta }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}) 