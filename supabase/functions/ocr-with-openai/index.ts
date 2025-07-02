import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('OpenAI OCR function loaded')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image_b64 } = await req.json()
    if (!image_b64) {
      throw new Error('No image data provided.')
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in Supabase secrets.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a highly accurate math OCR tool. Your task is to analyze the user-provided image, identify the mathematical problem or equation within it, and return ONLY the corresponding LaTeX string for that problem. Do not provide any explanation, context, or surrounding text. For example, if you see "x^2 + 5x + 6 = 0", you must return "\\\\x^{\\\\^2} + 5x + 6 = 0".',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image_b64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`OpenAI API error: ${errorBody.error.message}`)
    }

    const result = await response.json()
    const latex = result.choices[0].message.content.trim()

    return new Response(JSON.stringify({ latex }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in OpenAI OCR function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 