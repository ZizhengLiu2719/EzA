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

  const { pin, nickname } = await req.json()
  if (!pin || !nickname) return new Response('Invalid body', { status: 400 })

  // Session lookup
  const { data: session, error: sessErr } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('pin', pin)
    .single()

  if (sessErr || !session) return new Response('Session not found', { status: 404 })

  if (session.status !== 'waiting') return new Response('Session already started', { status: 400 })

  const authUser = (req as any).context?.user
  const user_id = authUser?.id ?? null

  // Add participant row
  const { data: participantRow, error: partErr } = await supabase
    .from('quiz_participants')
    .insert({ session_id: session.id, user_id, nickname })
    .select()
    .single()

  if (partErr) return new Response(partErr.message, { status: 500 })

  // Get questions
  // For simplicity, fetch from flashcards again (could be pre-generated)
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('id, question, option_a, option_b, option_c, option_d, correct_idx')
    .eq('set_id', session.flashcard_set_id)
    .limit(50)

  const questions = (flashcards ?? []).map((c) => ({
    id: c.id,
    text: c.question,
    options: [c.option_a, c.option_b, c.option_c, c.option_d],
    correctIndex: c.correct_idx,
  }))

  return new Response(
    JSON.stringify({ sessionId: session.id, participantId: participantRow.id, questions }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}) 