// @ts-nocheck
// Edge Function: create_quiz_session
// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6'

// Environment variables set by Supabase platform
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { flashcard_set_id, question_count } = await req.json()
  if (!flashcard_set_id || !question_count) {
    return new Response('Invalid body', { status: 400 })
  }

  // Get authenticated user (host)
  const { user } = (req as any).context?.user ?? {}
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Generate unique 6-digit PIN
  let pin: string
  while (true) {
    pin = Math.floor(100000 + Math.random() * 900000).toString()
    const { count } = await supabase
      .from('quiz_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('pin', pin)
    if ((count ?? 0) === 0) break
  }

  // Create session row
  const { data: sessionRow, error: insertError } = await supabase
    .from('quiz_sessions')
    .insert({ pin, host_id: user.id, flashcard_set_id })
    .select()
    .single()

  if (insertError) {
    console.error(insertError)
    return new Response(insertError.message, { status: 500 })
  }

  // Pick N flashcards randomly from set
  const { data: flashcards, error: cardsErr } = await supabase
    .from('flashcards')
    .select('id, question, option_a, option_b, option_c, option_d, correct_idx')
    .eq('set_id', flashcard_set_id)
    .limit(question_count)
    .order('RANDOM()')

  if (cardsErr) {
    console.error(cardsErr)
    return new Response(cardsErr.message, { status: 500 })
  }

  const questions = (flashcards ?? []).map((c) => ({
    id: c.id,
    text: c.question,
    options: [c.option_a, c.option_b, c.option_c, c.option_d],
    correctIndex: c.correct_idx,
  }))

  return new Response(
    JSON.stringify({ sessionId: sessionRow.id, pin, questions }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}) 